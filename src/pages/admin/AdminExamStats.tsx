import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sortExams, getExamScore } from '@/lib/utils';
import { BarChart2, BookOpen, FileText, ChevronDown, ChevronRight, Loader2, TrendingUp, AlertCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SubjectRow { id: string; name: string; semester: number; }
interface ExamRow    { id: string; title: string; }
interface OptionRow  { label: string; is_correct: boolean; }
interface QuestionRow { id: string; exam_id: string; options: OptionRow[]; }

interface ExamStat {
  exam: ExamRow;
  totalQ: number;
  counts: Record<string, number>;   // { A: 12, B: 8, … }
  noAnswer: number;                 // questions with no correct option
}

interface SubjectGroup {
  subject: SubjectRow;
  exams: ExamStat[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const PALETTE: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  A: { bg: '#edf5ff', border: '#dbeafe', text: '#2563eb', bar: '#3b82f6' },
  B: { bg: '#f3eefd', border: '#ede9fe', text: '#7c3aed', bar: '#8b5cf6' },
  C: { bg: '#eafaf5', border: '#d1fae5', text: '#059669', bar: '#10b981' },
  D: { bg: '#fff7ed', border: '#ffedd5', text: '#d97706', bar: '#f59e0b' },
  E: { bg: '#fff1f2', border: '#fecdd3', text: '#e11d48', bar: '#f43f5e' },
  F: { bg: '#f0f9ff', border: '#bae6fd', text: '#0284c7', bar: '#38bdf8' },
  G: { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', bar: '#a78bfa' },
  H: { bg: '#fdf4ff', border: '#f5d0fe', text: '#86198f', bar: '#d946ef' },
};

const DEFAULT_PAL = { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', bar: '#94a3b8' };

function getPal(label: string) { return PALETTE[label.toUpperCase()] ?? DEFAULT_PAL; }

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Horizontal bar for one answer option */
function AnswerBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const pal = getPal(label);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: pal.bar, color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12.5, fontWeight: 900,
      }}>{label}</span>
      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 99, height: 10, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: pal.bar, borderRadius: 99,
          transition: 'width 0.5s ease',
          minWidth: count > 0 ? 4 : 0,
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: pal.text, minWidth: 28, textAlign: 'right' }}>{count}</span>
      <span style={{ fontSize: 11.5, color: '#94a3b8', minWidth: 38 }}>({pct.toFixed(0)}%)</span>
    </div>
  );
}

/** Card for a single exam's stats */
function ExamStatCard({ stat }: { stat: ExamStat }) {
  const [open, setOpen] = useState(false);
  const presentLabels = LABELS.filter(l => (stat.counts[l] ?? 0) > 0);
  const dominant = Object.entries(stat.counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18,
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: 12,
    }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', cursor: 'pointer',
          background: open ? '#f8fafc' : '#ffffff', transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{stat.exam.title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {stat.totalQ} câu hỏi
              {stat.noAnswer > 0 && <span style={{ color: '#e11d48', marginLeft: 8 }}>· {stat.noAnswer} câu chưa có đáp án</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {presentLabels.slice(0, 4).map(l => {
            const pal = getPal(l);
            return (
              <span key={l} style={{
                padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                background: pal.bg, color: pal.text, border: `1px solid ${pal.border}`,
              }}>{l}: {stat.counts[l]}</span>
            );
          })}
          {open ? <ChevronDown size={15} style={{ color: '#94a3b8' }} /> : <ChevronRight size={15} style={{ color: '#94a3b8' }} />}
        </div>
      </div>

      {open && (
        <div style={{ padding: '14px 20px 18px 20px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ padding: '10px 16px', borderRadius: 12, background: '#edf5ff', border: '1px solid #dbeafe', flex: '1 1 120px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Tổng câu hỏi</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb' }}>{stat.totalQ}</div>
            </div>
            {dominant && (
              <div style={{ padding: '10px 16px', borderRadius: 12, background: getPal(dominant[0]).bg, border: `1px solid ${getPal(dominant[0]).border}`, flex: '1 1 120px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Đáp án nhiều nhất</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: getPal(dominant[0]).text }}>
                  {dominant[0]} ({dominant[1]})
                </div>
              </div>
            )}
            {stat.noAnswer > 0 && (
              <div style={{ padding: '10px 16px', borderRadius: 12, background: '#fff1f2', border: '1px solid #fecdd3', flex: '1 1 120px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Chưa có đáp án</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#e11d48' }}>{stat.noAnswer}</div>
              </div>
            )}
            <div style={{ padding: '10px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', flex: '1 1 120px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Số loại đáp án</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#475569' }}>{Object.keys(stat.counts).length}</div>
            </div>
          </div>

          <div>
            {LABELS.filter(l => (stat.counts[l] ?? 0) > 0).map(l => (
              <AnswerBar key={l} label={l} count={stat.counts[l] ?? 0} total={stat.totalQ - stat.noAnswer} />
            ))}
            {Object.keys(stat.counts).filter(k => !LABELS.includes(k)).map(k => (
              <AnswerBar key={k} label={k} count={stat.counts[k]} total={stat.totalQ - stat.noAnswer} />
            ))}
          </div>

          {stat.totalQ > 0 && stat.noAnswer === 0 && (() => {
            const vals = Object.values(stat.counts);
            if (vals.length === 0) return null;
            const max = Math.max(...vals);
            const min = Math.min(...vals);
            const diff = max - min;
            const balanced = diff <= Math.ceil(stat.totalQ * 0.15);
            return (
              <div style={{
                marginTop: 12, padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                background: balanced ? '#f0fdf4' : '#fff7ed',
                color: balanced ? '#15803d' : '#b45309',
                border: `1px solid ${balanced ? '#bbf7d0' : '#fde68a'}`,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {balanced
                  ? '✅ Phân bố đáp án khá đồng đều'
                  : `⚠️ Đáp án ${Object.entries(stat.counts).sort((a, b) => b[1] - a[1])[0]?.[0]} chiếm ưu thế (${max} câu) — chênh lệch ${diff} câu so với thấp nhất`}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// tiny helper pill
function Pill({ label, value, bg, border, text }: { label: string; value: number; bg: string; border: string; text: string }) {
  return (
    <div style={{ padding: '6px 14px', borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}: </span>
      <span style={{ fontSize: 13, fontWeight: 900, color: text }}>{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminExamStats() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: subjectsData, error: subErr } = await supabase
          .from('subjects').select('id, name, semester').order('semester').order('name').limit(10000);
        if (subErr) throw subErr;
        const subjects: SubjectRow[] = subjectsData ?? [];

        const { data: esData, error: esErr } = await supabase
          .from('exam_subjects').select('exam_id, subject_id').limit(20000);
        if (esErr) throw esErr;
        const examSubjectMap: Record<string, string[]> = {};
        const subjectExamMap: Record<string, string[]> = {};
        for (const row of (esData ?? [])) {
          if (!examSubjectMap[row.exam_id]) examSubjectMap[row.exam_id] = [];
          examSubjectMap[row.exam_id].push(row.subject_id);
          if (!subjectExamMap[row.subject_id]) subjectExamMap[row.subject_id] = [];
          subjectExamMap[row.subject_id].push(row.exam_id);
        }

        const { data: examsData, error: examErr } = await supabase
          .from('exams').select('id, title').order('created_at', { ascending: false }).limit(10000);
        if (examErr) throw examErr;
        const exams: ExamRow[] = examsData ?? [];
        const examById: Record<string, ExamRow> = {};
        for (const e of exams) examById[e.id] = e;

        // Helper: paginate any flat query until all rows are fetched
        async function fetchAll<T>(
          queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
        ): Promise<T[]> {
          const PAGE = 1000;
          const result: T[] = [];
          let from = 0;
          while (true) {
            const { data, error } = await queryFn(from, from + PAGE - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            result.push(...data);
            if (data.length < PAGE) break;
            from += PAGE;
          }
          return result;
        }

        // Two FLAT queries (2 columns each) running in parallel — fast even with many pages
        const [allQuestions, allCorrectOptions] = await Promise.all([
          fetchAll<{ id: string; exam_id: string }>((f, t) =>
            supabase.from('questions').select('id, exam_id').range(f, t)
          ),
          fetchAll<{ question_id: string; label: string }>((f, t) =>
            supabase.from('question_options').select('question_id, label')
              .eq('is_correct', true).range(f, t)
          ),
        ]);

        console.log(`[ExamStats] questions=${allQuestions.length}, correct_options=${allCorrectOptions.length}`);

        // Build lookup: question_id → correct answer labels
        const correctByQ: Record<string, string[]> = {};
        for (const o of allCorrectOptions) {
          if (!correctByQ[o.question_id]) correctByQ[o.question_id] = [];
          correctByQ[o.question_id].push(o.label.toUpperCase());
        }

        const examStatsMap: Record<string, ExamStat> = {};
        for (const q of allQuestions) {
          if (!examStatsMap[q.exam_id]) {
            const exam = examById[q.exam_id];
            if (!exam) continue;
            examStatsMap[q.exam_id] = { exam, totalQ: 0, counts: {}, noAnswer: 0 };
          }
          const stat = examStatsMap[q.exam_id];
          stat.totalQ++;
          const labels = correctByQ[q.id] ?? [];
          if (labels.length === 0) {
            stat.noAnswer++;
          } else {
            for (const lbl of labels) {
              stat.counts[lbl] = (stat.counts[lbl] ?? 0) + 1;
            }
          }
        }


        const result: SubjectGroup[] = [];
        for (const subject of subjects) {
          const examIds = subjectExamMap[subject.id] ?? [];
          const examStats = (examIds.map(id => examStatsMap[id]).filter(Boolean) as ExamStat[])
            .sort((a, b) => {
              const diff = getExamScore(b.exam.title) - getExamScore(a.exam.title);
              return diff !== 0 ? diff : a.exam.title.localeCompare(b.exam.title);
            });
          if (examStats.length === 0) continue;
          result.push({ subject, exams: examStats });
        }

        const linkedExamIds = new Set(Object.keys(examSubjectMap));
        const unlinkedStats = Object.values(examStatsMap).filter(s => !linkedExamIds.has(s.exam.id));
        if (unlinkedStats.length > 0) {
          result.push({ subject: { id: '__unlinked__', name: 'Chưa gắn môn học', semester: 0 }, exams: unlinkedStats });
        }

        setGroups(result);
        if (result.length > 0) setOpenSubjects(new Set([result[0].subject.id]));
      } catch (e: any) {
        setError(e?.message ?? 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const globalStats = useMemo(() => {
    const totals: Record<string, number> = {};
    let totalQ = 0, totalExams = 0;
    for (const g of groups) {
      for (const stat of g.exams) {
        totalExams++;
        totalQ += stat.totalQ;
        for (const [k, v] of Object.entries(stat.counts)) totals[k] = (totals[k] ?? 0) + v;
      }
    }
    return { totals, totalQ, totalExams };
  }, [groups]);

  const toggleSubject = (id: string) =>
    setOpenSubjects(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: '#e11d48' }}>
      <AlertCircle size={40} />
      <p style={{ fontWeight: 700, fontSize: 15 }}>{error}</p>
    </div>
  );

  return (
    <div style={{ background: '#f4f7fc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", padding: '32px 32px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
          }}>
            <BarChart2 size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
              Thống kê phân bố đáp án
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Theo từng đề thi &amp; môn học</p>
          </div>
        </div>
      </div>

      {/* Global summary */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22,
        padding: '20px 24px', marginBottom: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Tổng quan hệ thống</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Pill label="Môn học" value={groups.length} bg="#edf5ff" border="#dbeafe" text="#2563eb" />
          <Pill label="Đề thi" value={globalStats.totalExams} bg="#f3eefd" border="#ede9fe" text="#8b5cf6" />
          <Pill label="Câu hỏi" value={globalStats.totalQ} bg="#eafaf5" border="#d1fae5" text="#059669" />
          {LABELS.filter(l => (globalStats.totals[l] ?? 0) > 0).map(l => (
            <Pill key={l} label={`Đáp án ${l}`} value={globalStats.totals[l]} bg={getPal(l).bg} border={getPal(l).border} text={getPal(l).text} />
          ))}
        </div>
      </div>

      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#94a3b8', fontSize: 14, background: '#ffffff', borderRadius: 22, border: '1px solid #e2e8f0' }}>
          <BarChart2 size={48} style={{ color: '#e2e8f0', marginBottom: 12 }} />
          <p style={{ fontWeight: 700 }}>Chưa có dữ liệu đề thi nào</p>
        </div>
      )}

      {/* Subject groups */}
      {groups.map(g => {
        const isOpen = openSubjects.has(g.subject.id);
        const totalQInSubj = g.exams.reduce((s, e) => s + e.totalQ, 0);
        return (
          <div key={g.subject.id} style={{ marginBottom: 20 }}>
            <div
              onClick={() => toggleSubject(g.subject.id)}
              style={{
                background: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: isOpen ? '20px 20px 0 0' : 20,
                padding: '16px 22px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: g.subject.semester > 0 ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={16} color={g.subject.semester > 0 ? '#fff' : '#94a3b8'} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>
                    {g.subject.semester > 0 && <span style={{ color: '#94a3b8', fontWeight: 600, marginRight: 6, fontSize: 13 }}>Kỳ {g.subject.semester} ·</span>}
                    {g.subject.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{g.exams.length} đề · {totalQInSubj} câu hỏi</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {LABELS.filter(l => g.exams.some(e => (e.counts[l] ?? 0) > 0)).slice(0, 4).map(l => {
                  const total = g.exams.reduce((s, e) => s + (e.counts[l] ?? 0), 0);
                  const pal = getPal(l);
                  return (
                    <span key={l} style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800, background: pal.bg, color: pal.text, border: `1px solid ${pal.border}` }}>
                      {l}: {total}
                    </span>
                  );
                })}
                {isOpen ? <ChevronDown size={18} style={{ color: '#94a3b8' }} /> : <ChevronRight size={18} style={{ color: '#94a3b8' }} />}
              </div>
            </div>

            {isOpen && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '16px 18px',
              }}>
                {g.exams.map(stat => <ExamStatCard key={stat.exam.id} stat={stat} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
