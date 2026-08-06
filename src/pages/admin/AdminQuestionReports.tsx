import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, MessageSquareWarning, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type QuestionReport = {
  id: string;
  question_id: string;
  user_id: string;
  suggested_option_id: string;
  note: string | null;
  status: string;
  created_at: string;
  question?: any; 
  user?: any;
  suggested_option?: any;
};

export default function AdminQuestionReports() {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('question_reports')
      .select(`
        *,
        question:questions(*, options:question_options(*)),
        user:profiles(*),
        suggested_option:question_options(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('L?i t?i danh sách báo cáo');
      console.error(error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const groupedReports = reports.reduce((acc, report) => {
    if (!acc[report.question_id]) {
      acc[report.question_id] = {
        question: report.question,
        reports: [],
      };
    }
    acc[report.question_id].reports.push(report);
    return acc;
  }, {} as Record<string, { question: any; reports: QuestionReport[] }>);

  const handleApprove = async (questionId: string, suggestedOptionId: string) => {
    if (!window.confirm('Ch?p nh?n d? xu?t này? H? th?ng s? c?p nh?t dáp án dúng ngay l?p t?c.')) return;
    try {
      await supabase
        .from('question_options')
        .update({ is_correct: false })
        .eq('question_id', questionId);

      await supabase
        .from('question_options')
        .update({ is_correct: true })
        .eq('id', suggestedOptionId);

      await supabase
        .from('question_reports')
        .update({ status: 'approved' })
        .eq('question_id', questionId)
        .eq('status', 'pending'); 

      toast.success('Ðã c?p nh?t dáp án và phê duy?t báo cáo!');
      loadReports();
    } catch (error: any) {
      toast.error('L?i: ' + error.message);
    }
  };

  const handleRejectAll = async (questionId: string) => {
    if (!window.confirm('T? ch?i t?t c? báo cáo cho câu h?i này?')) return;
    try {
      await supabase
        .from('question_reports')
        .update({ status: 'rejected' })
        .eq('question_id', questionId)
        .eq('status', 'pending');

      toast.success('Ðã t? ch?i báo cáo.');
      loadReports();
    } catch (error: any) {
      toast.error('L?i: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40, background: '#f4f7fc', minHeight: '100vh' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  const groups = Object.values(groupedReports);

  return (
    <div style={{ padding: '24px', background: '#f4f7fc', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.03em' }}>
          <MessageSquareWarning size={32} style={{ color: '#f59e0b' }} />
          Báo cáo l?i câu h?i
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Qu?n lý các d? xu?t s?a dáp án t? h?c viên</p>
      </div>

      {groups.length === 0 ? (
        <div style={{ background: '#ffffff', padding: 40, borderRadius: 20, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, margin: 0 }}>Không có báo cáo l?i nào dang ch? x? lý.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groups.map((group) => {
            const currentCorrectOpts = group.question?.options?.filter((o: any) => o.is_correct) || [];
            
            const suggestionCounts: Record<string, { option: any, count: number, notes: string[] }> = {};
            group.reports.forEach(r => {
              if (r.suggested_option) {
                if (!suggestionCounts[r.suggested_option.id]) {
                  suggestionCounts[r.suggested_option.id] = { option: r.suggested_option, count: 0, notes: [] };
                }
                suggestionCounts[r.suggested_option.id].count++;
                if (r.note && r.note.trim()) {
                  suggestionCounts[r.suggested_option.id].notes.push(`${r.user?.full_name || r.user?.username || 'H?c viên'}: ${r.note}`);
                }
              }
            });

            return (
              <div key={group.question.id} style={{ background: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                {/* Question Info */}
                <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
                    Câu h?i
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16, lineHeight: 1.5 }}>
                    {group.question.content}
                  </div>
                  {group.question.image_url && (
                    <img src={group.question.image_url} alt="Question" style={{ maxWidth: 240, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }} />
                  )}
                  
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981', marginBottom: 8, letterSpacing: '0.05em' }}>ÐÁP ÁN ÐÚNG HI?N T?I</div>
                    {currentCorrectOpts.length > 0 ? (
                      currentCorrectOpts.map((o: any) => (
                        <div key={o.id} style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{o.label}. {o.content}</div>
                      ))
                    ) : (
                      <div style={{ fontSize: 15, color: '#ef4444', fontWeight: 600 }}>Chua có dáp án dúng</div>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                <div style={{ padding: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '0.02em' }}>CÁC Ð? XU?T S?A:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Object.values(suggestionCounts).map((sugg) => (
                      <div key={sugg.option.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: 20, background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>
                              Ð? xu?t {sugg.option.label}. {sugg.option.content}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#ea580c', background: '#ffedd5', padding: '4px 10px', borderRadius: 20 }}>
                              {sugg.count} Báo cáo
                            </span>
                          </div>
                          
                          {sugg.notes.length > 0 && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {sugg.notes.map((n, i) => (
                                <div key={i} style={{ fontSize: 14, color: '#475569', background: 'white', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                  {n}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleApprove(group.question.id, sugg.option.id)}
                          style={{
                            flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white',
                            border: 'none', borderRadius: 12, padding: '10px 20px',
                            fontSize: 14, fontWeight: 800, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Check size={18} /> Ch?p nh?n s?a
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reject All action */}
                <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleRejectAll(group.question.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'white', color: '#ef4444',
                      border: '2px solid #fecdd3', borderRadius: 12, padding: '8px 16px',
                      fontSize: 14, fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <X size={18} /> B? qua t?t c?
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
