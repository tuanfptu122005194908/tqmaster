import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import {
  extractExamsFromZip,
  extractExamFromFile,
  type ParsedExamData,
} from '@/lib/markdownExamParser';
import {
  UploadCloud,
  FileArchive,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  Clock,
  Sparkles,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

type Subject = Pick<Tables<'subjects'>, 'id' | 'name' | 'semester'>;

interface BulkExamZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  initialSubjectId?: string;
  onSuccess: (newExamIds: string[]) => void;
}

export const BulkExamZipModal: React.FC<BulkExamZipModalProps> = ({
  isOpen,
  onClose,
  subjects,
  initialSubjectId,
  onSuccess,
}) => {
  const { profile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [defaultDuration, setDefaultDuration] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [stripAnswers, setStripAnswers] = useState<boolean>(false);

  const rawParsedExamsRef = useRef<ParsedExamData[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedExams, setParsedExams] = useState<ParsedExamData[]>([]);
  const [expandedExamIdx, setExpandedExamIdx] = useState<number | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; percent: number }>({
    current: 0,
    total: 0,
    percent: 0,
  });
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadSuccessSummary, setUploadSuccessSummary] = useState<{
    examCount: number;
    questionCount: number;
    subjectName: string;
    createdExamIds: string[];
  } | null>(null);

  // Initialize selected subject
  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    } else if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [initialSubjectId, subjects]);

  // Reset state when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setParsedExams([]);
      rawParsedExamsRef.current = [];
      setIsParsing(false);
      setIsUploading(false);
      setUploadSuccessSummary(null);
      setExpandedExamIdx(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStripAnswers = (checked: boolean) => {
    setStripAnswers(checked);
    if (rawParsedExamsRef.current.length > 0) {
      setParsedExams(prev =>
        prev.map((exam, idx) => {
          const raw = rawParsedExamsRef.current[idx] || exam;
          if (checked) {
            const updatedQuestions = raw.questions.map(q => ({
              ...q,
              correctAnswers: [],
              options: q.options.map(opt => ({ ...opt, isCorrect: false })),
            }));
            return {
              ...exam,
              questions: updatedQuestions,
              unansweredQuestions: updatedQuestions.map(q => q.orderNum),
            };
          } else {
            return {
              ...exam,
              questions: raw.questions,
              unansweredQuestions: raw.unansweredQuestions,
            };
          }
        })
      );
    }
  };

  const handleFileProcess = async (file: File) => {
    const isZip = file.name.endsWith('.zip') || file.type.includes('zip');
    const isMdOrTxt = file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.markdown');

    if (!isZip && !isMdOrTxt) {
      toast.error('Vui lòng chọn file nén .zip hoặc file markdown .md / .txt');
      return;
    }

    setIsParsing(true);
    setParsedExams([]);
    rawParsedExamsRef.current = [];
    setUploadSuccessSummary(null);

    try {
      let rawExams: ParsedExamData[] = [];
      if (isZip) {
        rawExams = await extractExamsFromZip(file, { stripAnswers: false });
      } else {
        const singleExam = await extractExamFromFile(file, { stripAnswers: false });
        if (singleExam.questions.length > 0) {
          rawExams = [singleExam];
        }
      }

      if (rawExams.length === 0) {
        toast.error('Không tìm thấy file đề thi .md hoặc câu hỏi nào trong file.');
      } else {
        rawParsedExamsRef.current = rawExams;

        // Apply stripAnswers setting if currently checked
        const displayExams = rawExams.map(exam => {
          if (!stripAnswers) return exam;
          const updatedQuestions = exam.questions.map(q => ({
            ...q,
            correctAnswers: [],
            options: q.options.map(opt => ({ ...opt, isCorrect: false })),
          }));
          return {
            ...exam,
            questions: updatedQuestions,
            unansweredQuestions: updatedQuestions.map(q => q.orderNum),
          };
        });

        setParsedExams(displayExams);
        const totalQ = rawExams.reduce((acc, e) => acc + e.totalQuestions, 0);
        toast.success(`Đã nhận diện thành công ${rawExams.length} đề thi với ${totalQ} câu hỏi!`);
      }
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      toast.error('Lỗi khi đọc file: ' + (err?.message || 'File hỏng hoặc không đúng định dạng'));
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Toggle selection
  const toggleSelectAll = (select: boolean) => {
    setParsedExams(prev => prev.map(e => ({ ...e, selected: select })));
  };

  const toggleSelectExam = (idx: number) => {
    setParsedExams(prev =>
      prev.map((e, i) => (i === idx ? { ...e, selected: !e.selected } : e))
    );
  };

  const updateExamTitle = (idx: number, newTitle: string) => {
    setParsedExams(prev =>
      prev.map((e, i) => (i === idx ? { ...e, title: newTitle } : e))
    );
  };

  const removeExam = (idx: number) => {
    setParsedExams(prev => prev.filter((_, i) => i !== idx));
  };

  // Stats calculation
  const selectedExams = parsedExams.filter(e => e.selected);
  const totalQuestions = selectedExams.reduce((acc, e) => acc + e.totalQuestions, 0);
  const fullyAnsweredExams = selectedExams.filter(e => e.unansweredQuestions.length === 0).length;
  const examsWithUnanswered = selectedExams.filter(e => e.unansweredQuestions.length > 0).length;

  // Execute Upload
  const handleStartUpload = async () => {
    if (!selectedSubjectId) {
      toast.error('Vui lòng chọn môn học cần thêm đề thi.');
      return;
    }

    if (selectedExams.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đề thi để tải lên.');
      return;
    }

    const currentSubject = subjects.find(s => s.id === selectedSubjectId);
    const subjectName = currentSubject?.name || 'Môn học';

    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedExams.length, percent: 0 });

    const createdIds: string[] = [];
    let importedQuestionCount = 0;

    try {
      for (let i = 0; i < selectedExams.length; i++) {
        const examData = selectedExams[i];
        const examNum = i + 1;
        const progressPct = Math.round((i / selectedExams.length) * 100);

        setUploadProgress({
          current: examNum,
          total: selectedExams.length,
          percent: progressPct,
        });
        setUploadStatusText(`Đang tạo đề ${examNum}/${selectedExams.length}: "${examData.title}"...`);

        // 1. Insert Exam record
        const { data: newExam, error: examErr } = await supabase
          .from('exams')
          .insert({
            title: examData.title,
            description: examData.description || null,
            duration_min: defaultDuration || examData.durationMin || 60,
            is_active: isActive,
            created_by: profile?.id,
          } as any)
          .select()
          .single();

        if (examErr || !newExam) {
          console.error('Error creating exam:', examErr);
          toast.error(`Không thể tạo đề "${examData.title}": ${examErr?.message}`);
          continue;
        }

        createdIds.push(newExam.id);

        // 2. Link with subject
        const { error: linkErr } = await supabase.from('exam_subjects').insert({
          exam_id: newExam.id,
          subject_id: selectedSubjectId,
        } as any);

        if (linkErr) {
          console.error('Error linking subject:', linkErr);
        }

        // 3. Insert Questions and Options
        const qList = examData.questions;
        for (let qi = 0; qi < qList.length; qi++) {
          const qData = qList[qi];
          setUploadStatusText(
            `Đang tạo đề ${examNum}/${selectedExams.length}: "${examData.title}" (Câu ${qi + 1}/${qList.length})...`
          );

          const { data: qRecord, error: qErr } = await supabase
            .from('questions')
            .insert({
              exam_id: newExam.id,
              order_num: qData.orderNum || qi + 1,
              content: qData.content || null,
              type: 'text',
              chapter_name: qData.chapterName || 'Tổng hợp',
            } as any)
            .select()
            .single();

          if (qErr || !qRecord) {
            console.error('Error inserting question:', qErr);
            continue;
          }

          importedQuestionCount++;

          if (qData.options && qData.options.length > 0) {
            const optionsToInsert = qData.options.map(opt => ({
              question_id: qRecord.id,
              label: opt.label,
              content: opt.content || '',
              is_correct: stripAnswers ? false : opt.isCorrect,
            }));

            const { error: optErr } = await supabase
              .from('question_options')
              .insert(optionsToInsert as any);

            if (optErr) {
              console.error('Error inserting options:', optErr);
            }
          }
        }
      }

      setUploadProgress({
        current: selectedExams.length,
        total: selectedExams.length,
        percent: 100,
      });

      setUploadSuccessSummary({
        examCount: createdIds.length,
        questionCount: importedQuestionCount,
        subjectName,
        createdExamIds: createdIds,
      });

      toast.success(
        `Đã tải lên thành công ${createdIds.length} đề thi (${importedQuestionCount} câu hỏi) cho môn ${subjectName}!`
      );
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error('Có lỗi xảy ra trong quá trình tải lên: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    if (uploadSuccessSummary) {
      onSuccess(uploadSuccessSummary.createdExamIds);
    }
    onClose();
  };

  // Group subjects by Semester
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: 24,
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, sans-serif",
          color: '#0f172a',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
              }}
            >
              <FileArchive size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}>
                Tải đề thi hàng loạt từ file ZIP
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Hỗ trợ giải nén file ZIP chứa các đề thi Markdown (.md) và tự động nhận diện đáp án
              </p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#f4f7fc' }}>
          {/* SUCCESS SCREEN */}
          {uploadSuccessSummary ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '36px 24px',
                border: '1px solid #d1fae5',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 22,
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 20px rgba(21, 128, 61, 0.2)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                Tải lên hoàn tất thành công!
              </h3>
              <p style={{ fontSize: 14, color: '#475569', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Đã thêm <strong style={{ color: '#2563eb' }}>{uploadSuccessSummary.examCount} đề thi</strong> với tổng cộng{' '}
                <strong style={{ color: '#15803d' }}>{uploadSuccessSummary.questionCount} câu hỏi</strong> vào môn học{' '}
                <strong style={{ color: '#0f172a' }}>{uploadSuccessSummary.subjectName}</strong>.
              </p>

              <button
                onClick={handleFinish}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Check size={16} /> Hoàn tất & Xem đề thi
              </button>
            </div>
          ) : isUploading ? (
            /* UPLOADING SCREEN */
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '36px 24px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Loader2 size={30} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Đang xử lý tải lên hệ thống...
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>
                Vui lòng không tắt trình duyệt trong quá trình nhập dữ liệu
              </p>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 520,
                  height: 12,
                  background: '#f1f5f9',
                  borderRadius: 99,
                  overflow: 'hidden',
                  margin: '0 auto 14px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress.percent}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                    borderRadius: 99,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>
                {uploadProgress.percent}% ({uploadProgress.current}/{uploadProgress.total} đề thi)
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>{uploadStatusText}</div>
            </div>
          ) : (
            /* CONFIG & DROPZONE SCREEN */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Configuration Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                  alignItems: 'end',
                }}
              >
                {/* Subject Selector */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: '#334155',
                      marginBottom: 6,
                    }}
                  >
                    <BookOpen size={15} style={{ color: '#3b82f6' }} /> Chọn Môn học áp dụng
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {semesters.map(sem => {
                      const semSubjects = subjects.filter(s => s.semester === sem);
                      if (semSubjects.length === 0) return null;
                      return (
                        <optgroup key={sem} label={`--- KỲ ${sem} ---`}>
                          {semSubjects.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: '#334155',
                      marginBottom: 6,
                    }}
                  >
                    <Clock size={15} style={{ color: '#8b5cf6' }} /> Thời gian làm bài (phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={defaultDuration}
                    onChange={e => setDefaultDuration(parseInt(e.target.value, 10) || 60)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Is Active toggle & Strip answers toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1e293b',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    Kích hoạt đề ngay sau khi tải
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: stripAnswers ? '#2563eb' : '#475569',
                      cursor: 'pointer',
                    }}
                    title="Chỉ thêm câu hỏi và phương án, bỏ qua đáp án đúng (tạo đề rỗng đáp án để sinh viên tự luyện)"
                  >
                    <input
                      type="checkbox"
                      checked={stripAnswers}
                      onChange={e => handleToggleStripAnswers(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    <span>Chỉ nhập đề (không kèm đáp án)</span>
                  </label>
                </div>
              </div>

              {/* Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.md,.txt,.markdown"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: isDragging ? '#edf5ff' : '#ffffff',
                  border: isDragging ? '2px dashed #3b82f6' : '2px dashed #cbd5e1',
                  borderRadius: 22,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                {isParsing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', margin: 0 }}>
                      Đang giải nén và phân tích cấu trúc đề thi...
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 18,
                        background: '#edf5ff',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}
                    >
                      <UploadCloud size={28} />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                      Kéo thả file ZIP đề thi vào đây, hoặc click để chọn file
                    </h4>
                    <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                      Hỗ trợ file <strong>.zip</strong> (chứa nhiều đề thi .md) hoặc file đơn lẻ <strong>.md, .txt</strong>
                    </p>
                  </>
                )}
              </div>

              {/* PARSED PREVIEW SECTION */}
              {parsedExams.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Stat Cards Palette */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {/* Card 1: Total Exams */}
                    <div
                      style={{
                        background: '#edf5ff',
                        border: '1px solid #dbeafe',
                        borderRadius: 18,
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#3b82f6',
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Đề thi chọn
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>
                          {selectedExams.length} / {parsedExams.length}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Total Questions */}
                    <div
                      style={{
                        background: '#f3eefd',
                        border: '1px solid #ede9fe',
                        borderRadius: 18,
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#8b5cf6',
                        }}
                      >
                        <HelpCircle size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Tổng câu hỏi
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#8b5cf6' }}>{totalQuestions}</div>
                      </div>
                    </div>

                    {/* Card 3: Fully Answered / Practice Mode */}
                    <div
                      style={{
                        background: stripAnswers ? '#eff6ff' : '#eafaf5',
                        border: stripAnswers ? '1px solid #dbeafe' : '1px solid #d1fae5',
                        borderRadius: 18,
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: stripAnswers ? '#2563eb' : '#059669',
                        }}
                      >
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          {stripAnswers ? 'Chế độ đề thi' : 'Đủ đáp án 100%'}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: stripAnswers ? '#2563eb' : '#059669' }}>
                          {stripAnswers ? 'Tự luyện (Không đáp án)' : `${fullyAnsweredExams} đề`}
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Need Attention / Ready */}
                    <div
                      style={{
                        background: stripAnswers ? '#eafaf5' : '#fff7ed',
                        border: stripAnswers ? '1px solid #d1fae5' : '1px solid #ffedd5',
                        borderRadius: 18,
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: stripAnswers ? '#059669' : '#d97706',
                        }}
                      >
                        {stripAnswers ? <Sparkles size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          {stripAnswers ? 'Trạng thái' : 'Cần kiểm tra'}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: stripAnswers ? '#059669' : '#d97706' }}>
                          {stripAnswers ? 'Sẵn sàng tải lên' : `${examsWithUnanswered} đề`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* List of Parsed Exams */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 20,
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    }}
                  >
                    {/* Header bar */}
                    <div
                      style={{
                        padding: '12px 18px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                          Danh sách đề thi nhận diện ({parsedExams.length})
                        </span>
                        {stripAnswers && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #dbeafe',
                            }}
                          >
                            Đề tự luyện
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => toggleSelectAll(true)}
                          style={{
                            padding: '4px 10px',
                            background: '#eff6ff',
                            border: '1px solid #dbeafe',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#2563eb',
                            cursor: 'pointer',
                          }}
                        >
                          Chọn tất cả
                        </button>
                        <button
                          onClick={() => toggleSelectAll(false)}
                          style={{
                            padding: '4px 10px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#64748b',
                            cursor: 'pointer',
                          }}
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                      {parsedExams.map((exam, idx) => {
                        const isExpanded = expandedExamIdx === idx;
                        const hasUnanswered = exam.unansweredQuestions.length > 0;

                        return (
                          <div
                            key={idx}
                            style={{
                              borderBottom: idx < parsedExams.length - 1 ? '1px solid #f1f5f9' : 'none',
                              background: exam.selected ? '#ffffff' : '#f8fafc',
                              opacity: exam.selected ? 1 : 0.65,
                              transition: 'all 0.15s',
                            }}
                          >
                            <div
                              style={{
                                padding: '12px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                              }}
                            >
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={exam.selected}
                                onChange={() => toggleSelectExam(idx)}
                                style={{ width: 17, height: 17, accentColor: '#2563eb', cursor: 'pointer' }}
                              />

                              {/* Title & Info */}
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <input
                                    value={exam.title}
                                    onChange={e => updateExamTitle(idx, e.target.value)}
                                    style={{
                                      fontSize: 13.5,
                                      fontWeight: 800,
                                      color: '#0f172a',
                                      border: '1px solid transparent',
                                      borderRadius: 6,
                                      padding: '2px 6px',
                                      background: 'transparent',
                                      outline: 'none',
                                      maxWidth: 360,
                                    }}
                                    onFocus={e => (e.target.style.borderColor = '#93c5fd')}
                                    onBlur={e => (e.target.style.borderColor = 'transparent')}
                                  />
                                  <span style={{ fontSize: 11, color: '#94a3b8' }}>({exam.filename})</span>
                                </div>
                                {exam.description && (
                                  <div style={{ fontSize: 12, color: '#64748b', paddingLeft: 6 }}>
                                    {exam.description}
                                  </div>
                                )}
                              </div>

                              {/* Badges */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <span
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: 8,
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    border: '1px solid #dbeafe',
                                  }}
                                >
                                  {exam.totalQuestions} câu
                                </span>

                                <span
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: 8,
                                    background: stripAnswers
                                      ? '#eff6ff'
                                      : hasUnanswered
                                      ? '#fef3c7'
                                      : '#dcfce7',
                                    color: stripAnswers
                                      ? '#2563eb'
                                      : hasUnanswered
                                      ? '#b45309'
                                      : '#15803d',
                                    border: stripAnswers
                                      ? '1px solid #dbeafe'
                                      : hasUnanswered
                                      ? '1px solid #fde68a'
                                      : '1px solid #bbf7d0',
                                  }}
                                >
                                  {stripAnswers
                                    ? 'Đề tự luyện (Không có đáp án)'
                                    : hasUnanswered
                                    ? `Thiếu đáp án ${exam.unansweredQuestions.length} câu`
                                    : '100% Có đáp án'}
                                </span>

                                {/* Expand preview button */}
                                <button
                                  onClick={() => setExpandedExamIdx(isExpanded ? null : idx)}
                                  style={{
                                    padding: '5px 8px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                  {isExpanded ? 'Đóng' : 'Xem'}
                                </button>

                                <button
                                  onClick={() => removeExam(idx)}
                                  style={{
                                    padding: 5,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#e11d48',
                                  }}
                                  title="Xóa đề này khỏi danh sách tải"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Question Preview */}
                            {isExpanded && (
                              <div
                                style={{
                                  padding: '12px 18px 16px 48px',
                                  background: '#f8fafc',
                                  borderTop: '1px solid #e2e8f0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                }}
                              >
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                                  Xem trước 5 câu hỏi đầu tiên:
                                </div>
                                {exam.questions.slice(0, 5).map((q, qIdx) => (
                                  <div
                                    key={qIdx}
                                    style={{
                                      background: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: 10,
                                      padding: '8px 12px',
                                      fontSize: 12,
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                                      Câu {q.orderNum}:{' '}
                                      <span style={{ fontWeight: 500, color: '#334155' }}>
                                        {q.content.length > 120 ? q.content.slice(0, 120) + '...' : q.content}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                      {q.options.map((opt, oIdx) => (
                                        <span
                                          key={oIdx}
                                          style={{
                                            fontSize: 11,
                                            padding: '2px 6px',
                                            borderRadius: 6,
                                            background: !stripAnswers && opt.isCorrect ? '#dcfce7' : '#f1f5f9',
                                            color: !stripAnswers && opt.isCorrect ? '#15803d' : '#475569',
                                            fontWeight: !stripAnswers && opt.isCorrect ? 800 : 500,
                                            border:
                                              !stripAnswers && opt.isCorrect
                                                ? '1px solid #bbf7d0'
                                                : '1px solid transparent',
                                          }}
                                        >
                                          {opt.label}. {opt.content ? (opt.content.length > 25 ? opt.content.slice(0, 25) + '...' : opt.content) : '(Trống)'}
                                        </span>
                                      ))}
                                      {!stripAnswers && q.correctAnswers.length > 0 && (
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', marginLeft: 'auto' }}>
                                          ✓ Đáp án: {q.correctAnswers.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {exam.questions.length > 5 && (
                                  <div style={{ fontSize: 11.5, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                                    ... và còn {exam.questions.length - 5} câu hỏi khác trong đề này.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!uploadSuccessSummary && !isUploading && (
          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleStartUpload}
              disabled={selectedExams.length === 0 || !selectedSubjectId || isParsing}
              style={{
                padding: '11px 28px',
                background:
                  selectedExams.length === 0 || !selectedSubjectId || isParsing
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                fontSize: 13.5,
                fontWeight: 800,
                cursor:
                  selectedExams.length === 0 || !selectedSubjectId || isParsing ? 'not-allowed' : 'pointer',
                boxShadow:
                  selectedExams.length === 0 || !selectedSubjectId || isParsing
                    ? 'none'
                    : '0 6px 18px rgba(37, 99, 235, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Sparkles size={16} /> Bắt đầu tải lên ({selectedExams.length} đề thi)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkExamZipModal;
