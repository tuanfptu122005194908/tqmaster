import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Supabase Edge Function: cleanup-chat-messages
// Chạy định kỳ (cron) mỗi giờ để xoá tin nhắn đã đọc
// trong các conversation không có tin mới trong 24h

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Cho phép invoke thủ công từ Supabase dashboard hoặc cron scheduler
  const authHeader = req.headers.get('Authorization');
  
  // Nếu có Authorization header thì verify; nếu là cron scheduler (internal) thì bypass
  const isInternalCron = req.headers.get('x-supabase-internal-cron') === 'true';
  
  if (!isInternalCron && authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    // Cho phép service role key
    const providedKey = authHeader?.replace('Bearer ', '');
    if (providedKey !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // 24 giờ trước

    // Bước 1: Tìm các conversation không có tin mới trong 24h
    const { data: staleConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .lt('last_message_at', cutoff);

    if (convError) {
      console.error('Error fetching stale conversations:', convError);
      return new Response(JSON.stringify({ error: convError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!staleConversations || staleConversations.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No stale conversations found', 
        cleaned: 0,
        timestamp: now.toISOString(),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalDeleted = 0;
    const cleanupResults: Array<{ conversationId: string; userId: string; deletedCount: number }> = [];

    // Bước 2: Với mỗi conversation stale, đếm và xoá tin đã đọc
    for (const conv of staleConversations) {
      // Đếm số tin nhắn đã đọc sẽ bị xoá (để ghi log)
      const { count: readCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', true);

      if (!readCount || readCount === 0) {
        continue; // Không có tin đã đọc, bỏ qua
      }

      // Ghi cleanup log TRƯỚC khi xoá (để user/admin có thể thấy thông báo)
      const { error: logError } = await supabase
        .from('chat_cleanup_logs')
        .insert({
          conversation_id: conv.id,
          user_id: conv.user_id,
          deleted_count: readCount,
          cleaned_at: now.toISOString(),
          notified: false,
        });

      if (logError) {
        console.error(`Error inserting cleanup log for conv ${conv.id}:`, logError);
        // Vẫn tiếp tục xoá dù log lỗi
      }

      // Xoá tin nhắn đã đọc (is_read = true)
      // KHÔNG xoá tin chưa đọc (is_read = false)
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conv.id)
        .eq('is_read', true);

      if (deleteError) {
        console.error(`Error deleting messages for conv ${conv.id}:`, deleteError);
        continue;
      }

      totalDeleted += readCount;
      cleanupResults.push({
        conversationId: conv.id,
        userId: conv.user_id,
        deletedCount: readCount,
      });
    }

    console.log(`[cleanup-chat-messages] Cleaned ${totalDeleted} messages from ${cleanupResults.length} conversations`);

    return new Response(JSON.stringify({
      message: 'Cleanup completed',
      totalDeleted,
      conversationsCleaned: cleanupResults.length,
      details: cleanupResults,
      timestamp: now.toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unexpected error in cleanup-chat-messages:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
