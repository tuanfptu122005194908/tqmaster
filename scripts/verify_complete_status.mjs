import { createClient } from '@supabase/supabase-js';

const SOURCE_URL = 'https://jokmwkkepasocfpcsmzd.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva213a2tlcGFzb2NmcGNzbXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODE0NTcsImV4cCI6MjA5Mjk1NzQ1N30.NiFtzrNo6K-MRSnF3dPPwDoV-Uki50BfhCaTCOEm-G0';

const TARGET_URL = 'https://vhljgmtithjeovtrghvy.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobGpnbXRpdGhqZW92dHJnaHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTM5NzEsImV4cCI6MjEwNDYyOTk3MX0.0eqtdv4M9Udnq3DtACj3ogZvWPl0Mr58kl32pgK3qpU';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'tuan0112';

const TABLES = [
  'profiles',
  'user_roles',
  'subjects',
  'exams',
  'exam_subjects',
  'questions',
  'question_options',
  'theories',
  'theory_subjects',
  'user_subjects',
  'discount_codes',
  'orders',
  'order_items',
  'exam_attempts',
  'attempt_answers',
  'question_reports',
  'announcements',
  'news_posts',
  'news_likes',
  'news_comments',
  'conversations',
  'chat_messages',
  'chat_cleanup_logs',
  'active_sessions',
  'system_settings'
];

async function main() {
  const sourceClient = createClient(SOURCE_URL, SOURCE_KEY);
  await sourceClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  const targetClient = createClient(TARGET_URL, TARGET_KEY);
  await targetClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  console.log('=== SO SÁNH SỐ LƯỢNG BẢN GHI GIỮA 2 DATABASE ===');
  console.log(
    'Bảng'.padEnd(22) +
    'DB Cũ'.padEnd(12) +
    'DB Mới'.padEnd(12) +
    'Chênh lệch'.padEnd(12) +
    'Trạng thái'
  );
  console.log('-'.repeat(75));

  for (const table of TABLES) {
    let srcCount = 0;
    let tgtCount = 0;
    let srcErr = null;
    let tgtErr = null;

    try {
      const { count, error } = await sourceClient.from(table).select('*', { count: 'exact', head: true });
      if (error) srcErr = error.message;
      else srcCount = count ?? 0;
    } catch (e) {
      srcErr = e.message;
    }

    try {
      const { count, error } = await targetClient.from(table).select('*', { count: 'exact', head: true });
      if (error) tgtErr = error.message;
      else tgtCount = count ?? 0;
    } catch (e) {
      tgtErr = e.message;
    }

    let status = 'OK';
    if (srcErr || tgtErr) {
      status = `Lỗi: ${srcErr || tgtErr}`;
    } else if (table === 'chat_messages' || table === 'conversations' || table === 'chat_cleanup_logs') {
      status = 'Bỏ qua (theo yêu cầu)';
    } else if (table === 'active_sessions') {
      status = 'Phiên động';
    } else if (tgtCount >= srcCount) {
      status = 'Đầy đủ (100%)';
    } else {
      status = `Thiếu ${srcCount - tgtCount} dòng`;
    }

    console.log(
      table.padEnd(22) +
      String(srcCount).padEnd(12) +
      String(tgtCount).padEnd(12) +
      String(tgtCount - srcCount).padEnd(12) +
      status
    );
  }
}

main().catch(console.error);
