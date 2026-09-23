import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import {
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Download,
  Pencil,
  Search,
  Sparkles,
  FileArchive,
  Eye,
  RefreshCw,
  Layers,
  UploadCloud,
} from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';
import { signStorageUrl, signStorageUrls } from '@/lib/signedImage';
import { parseTheoryDescription, formatTheoryDescription } from '@/lib/theoryMetadata';
import {
  inspectZipImages,
  uploadExtractedZipImages,
  extractZipImagesFromRemoteUrl,
} from '@/lib/peZipExtractor';
import { ExamImageViewerModal } from '@/components/common/ExamImageViewerModal';

type Theory  = Tables<'theories'>;
type Subject = Pick<Tables<'subjects'>, 'id' | 'name' | 'semester'>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a', transition: 'all 0.15s ease',
  boxSizing: 'border-box'
};

const TYPE_OPTS: Array<{ value: Theory['type']; label: string; icon: React.ReactNode }> = [
  { value: 'file',  label: 'File / Video', icon: <FileText size={15} /> },
  { value: 'link',  label: 'Link ngoài',   icon: <LinkIcon size={15} /> },
  { value: 'image', label: 'Hình ảnh',     icon: <ImageIcon size={15} /> },
];

const TypeIcon = ({ type }: { type: string }) => {
  if (type === 'image') return <ImageIcon size={16} />;
  if (type === 'link')  return <LinkIcon size={16} />;
  return <FileText size={16} />;
};

type Category = 'theory' | 'pe';

type FormState = {
  id?: string;
  title: string;
  description: string;
  type: Theory['type'];
  url: string;
  file_name: string;
  category: Category;
  subject_ids: string[];
  preview_images: string[];
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  type: 'file',
  url: '',
  file_name: '',
  category: 'theory',
  subject_ids: [],
  preview_images: [],
};

const CAT_LABEL: Record<Category, string> = {
  theory: 'Lý thuyết',
  pe: 'Tài liệu PE / Video',
};

const getCat = (t: any): Category => (t?.category === 'pe' ? 'pe' : 'theory');

export default function AdminTheory() {
  const { profile } = useApp();
  const [theories,    setTheories]    = useState<any[]>([]);
  const [subjects,    setSubjects]    = useState<Subject[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [filterSubj,  setFilterSubj]  = useState<string>('all');
  const [filterCat,   setFilterCat]   = useState<'all' | Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ZIP Extraction state
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractingProgress, setExtractingProgress] = useState<string | null>(null);

  // Batch Extraction state
  const [batchExtracting, setBatchExtracting] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; title: string } | null>(null);

  // Full-screen Image Viewer State
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');
  const [viewerZipUrl, setViewerZipUrl] = useState<string | undefined>(undefined);
  const [viewerZipName, setViewerZipName] = useState<string | undefined>(undefined);

  // Form ZIP upload state
  const [isProcessingZipInForm, setIsProcessingZipInForm] = useState<boolean>(false);
  const [zipProgressText, setZipProgressText] = useState<string>('');
  const zipInputRef = useRef<HTMLInputElement>(null);

  const fetchTheories = async () => {
    const { data } = await supabase.from('theories')
      .select('*, theory_subjects(subject_id)')
      .order('sort_order').order('created_at', { ascending: false });
    setTheories(data ?? []);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name, semester').order('semester').order('name');
    setSubjects(data ?? []);
  };

  useEffect(() => { fetchTheories(); fetchSubjects(); }, []);

  const getSubjectIds = (theory: any): string[] =>
    (theory.theory_subjects ?? []).map((ts: any) => ts.subject_id);

  const filtered = theories.filter(t => {
    const matchSubj = filterSubj === 'all' || getSubjectIds(t).includes(filterSubj);
    const matchCat  = filterCat === 'all' || getCat(t) === filterCat;
    const q = searchQuery.toLowerCase();
    const meta = parseTheoryDescription(t.description);
    const matchQ = !q || t.title.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q);
    return matchSubj && matchCat && matchQ;
  });

  // Calculate how many PE zip items haven't been extracted yet
  const unextractedPeZips = theories.filter(t => {
    if (getCat(t) !== 'pe') return false;
    const isZip = (t.file_name && t.file_name.toLowerCase().endsWith('.zip')) ||
                  (t.url && t.url.toLowerCase().includes('.zip'));
    const meta = parseTheoryDescription(t.description);
    return isZip && meta.preview_images.length === 0;
  });

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      category: filterCat === 'all' ? 'theory' : filterCat,
      preview_images: [],
    });
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    const meta = parseTheoryDescription(t.description);
    setForm({
      id: t.id,
      title: t.title,
      description: meta.description,
      type: t.type,
      url: t.url,
      file_name: t.file_name ?? '',
      category: getCat(t),
      subject_ids: getSubjectIds(t),
      preview_images: meta.preview_images,
    });
    setShowForm(true);
  };

  const toggleSubject = (id: string) => {
    setForm(p => ({
      ...p,
      subject_ids: p.subject_ids.includes(id)
        ? p.subject_ids.filter(x => x !== id)
        : [...p.subject_ids, id],
    }));
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề tài liệu'); return; }
    if (!form.url)          { toast.error('Vui lòng chọn hoặc dán đường dẫn file/link'); return; }

    setSaving(true);
    let theoryId = form.id;

    // Encode metadata if category is PE
    const finalDescription = form.category === 'pe'
      ? formatTheoryDescription(form.description, form.preview_images)
      : (form.description || null);

    if (theoryId) {
      const { error } = await supabase.from('theories').update({
        title: form.title,
        description: finalDescription,
        type: form.type,
        url: form.url,
        file_name: form.file_name || null,
        category: form.category,
      } as any).eq('id', theoryId);
      if (error) { toast.error('Lỗi cập nhật: ' + error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('theories').insert({
        title: form.title,
        description: finalDescription,
        type: form.type,
        url: form.url,
        file_name: form.file_name || null,
        category: form.category,
        created_by: profile?.id,
      } as any).select().single();

      if (error || !data) { toast.error('Lỗi tạo mới: ' + (error?.message ?? '')); setSaving(false); return; }
      theoryId = data.id;
    }

    await supabase.from('theory_subjects').delete().eq('theory_id', theoryId);
    if (form.subject_ids.length > 0) {
      await supabase.from('theory_subjects').insert(
        form.subject_ids.map(sid => ({ theory_id: theoryId!, subject_id: sid }))
      );
    }

    toast.success(form.id ? 'Đã cập nhật tài liệu' : 'Đã thêm tài liệu mới');
    setSaving(false);
    setShowForm(false);
    fetchTheories();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa tài liệu này?')) return;
    const { error } = await supabase.from('theories').delete().eq('id', id);
    if (error) toast.error('Lỗi xóa: ' + error.message);
    else { toast.success('Đã xóa tài liệu'); fetchTheories(); }
  };

  // 1-Click ZIP extraction directly on web for existing theory
  const handleExtractZipSingle = async (theory: any) => {
    if (!theory.url) {
      toast.error('Tài liệu chưa có file đính kèm');
      return;
    }
    setExtractingId(theory.id);
    setExtractingProgress('Đang chuẩn bị file ZIP...');
    try {
      const images = await extractZipImagesFromRemoteUrl(
        theory.url,
        theory.id,
        (status) => setExtractingProgress(status)
      );

      if (images.length === 0) {
        toast.warning('Không tìm thấy file ảnh (.png, .jpg, .jpeg, .webp, .gif) trong file ZIP này.');
        return;
      }

      const meta = parseTheoryDescription(theory.description);
      const newDescription = formatTheoryDescription(meta.description, images);
      const { error } = await supabase.from('theories').update({
        description: newDescription,
      } as any).eq('id', theory.id);

      if (error) throw error;

      toast.success(`Đã trích xuất thành công ${images.length} ảnh đề thi từ file ZIP!`);
      await fetchTheories();
    } catch (err: any) {
      console.error('Extract error:', err);
      toast.error('Lỗi trích xuất ảnh: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setExtractingId(null);
      setExtractingProgress(null);
    }
  };

  // Batch ZIP extraction directly on web for multiple theories
  const handleBatchExtractZip = async () => {
    if (unextractedPeZips.length === 0) {
      toast.info('Không có file ZIP nào cần trích xuất ảnh.');
      return;
    }

    if (!confirm(`Tìm thấy ${unextractedPeZips.length} tài liệu PE dạng ZIP chưa trích xuất ảnh. Bạn có muốn chuyển đổi trực tiếp trên web ngay bây giờ?`)) {
      return;
    }

    setBatchExtracting(true);
    let successCount = 0;
    let emptyCount = 0;
    let failedCount = 0;

    for (let i = 0; i < unextractedPeZips.length; i++) {
      const item = unextractedPeZips[i];
      setBatchProgress({ current: i + 1, total: unextractedPeZips.length, title: item.title });
      try {
        const images = await extractZipImagesFromRemoteUrl(
          item.url,
          item.id,
          (status) => setExtractingProgress(status)
        );

        if (images.length > 0) {
          const meta = parseTheoryDescription(item.description);
          const newDescription = formatTheoryDescription(meta.description, images);
          await supabase.from('theories').update({ description: newDescription } as any).eq('id', item.id);
          successCount++;
        } else {
          emptyCount++;
        }
      } catch (err) {
        console.error(`Batch extract error for ${item.title}:`, err);
        failedCount++;
      }
    }

    setBatchExtracting(false);
    setBatchProgress(null);
    setExtractingProgress(null);
    toast.success(`Hoàn tất chuyển đổi! Thành công: ${successCount}, Không có ảnh: ${emptyCount}, Thất bại: ${failedCount}`);
    await fetchTheories();
  };

  // Handle picking a zip file in the Create/Edit form
  const handleFormZipPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Vui lòng chọn file có định dạng .zip');
      return;
    }

    setIsProcessingZipInForm(true);
    setZipProgressText('Đang tải file ZIP lên Storage...');

    try {
      // 1. Upload original zip file to theory-files
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.zip`;
      const { error: upErr } = await supabase.storage.from('theory-files').upload(safeName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/zip',
      });
      if (upErr) throw upErr;

      const { data: { publicUrl: zipUrl } } = supabase.storage.from('theory-files').getPublicUrl(safeName);

      // Auto-populate title if empty
      const cleanTitle = file.name.replace(/\.zip$/i, '').replace(/[_-]+/g, ' ').trim();
      setForm(p => ({
        ...p,
        url: zipUrl,
        file_name: file.name,
        title: p.title.trim() ? p.title : cleanTitle,
      }));

      // 2. Scan and extract images from zip
      setZipProgressText('Đang quét và kiểm tra hình ảnh trong file ZIP...');
      const foundImages = await inspectZipImages(file);

      if (foundImages.length > 0) {
        setZipProgressText(`Tìm thấy ${foundImages.length} ảnh, đang tải lên hệ thống...`);
        const uploadedImageUrls = await uploadExtractedZipImages(
          foundImages,
          form.id || `pe_${Date.now()}`,
          (current, total, name) => setZipProgressText(`Đang tải ảnh ${current}/${total}: ${name}`)
        );

        setForm(p => ({
          ...p,
          preview_images: uploadedImageUrls,
        }));
        toast.success(`Đã tự động trích xuất ${uploadedImageUrls.length} ảnh đề thi từ file ZIP!`);
      } else {
        toast.info('File ZIP đã được tải lên thành công (không tìm thấy file ảnh bên trong).');
      }
    } catch (err: any) {
      console.error('ZIP handling error:', err);
      toast.error('Lỗi xử lý file ZIP: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsProcessingZipInForm(false);
      setZipProgressText('');
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  // Open Full-Screen Image Viewer Modal
  const openViewer = async (images: string[], title: string, zipUrl?: string, zipName?: string) => {
    if (!images || images.length === 0) return;
    try {
      const signMap = await signStorageUrls(images);
      const signedList = images.map(img => signMap.get(img) ?? img);
      let signedZip = zipUrl;
      if (zipUrl) {
        const zipMap = await signStorageUrls([zipUrl]);
        signedZip = zipMap.get(zipUrl) ?? zipUrl;
      }
      setViewerImages(signedList);
      setViewerTitle(title);
      setViewerZipUrl(signedZip);
      setViewerZipName(zipName);
    } catch (err) {
      console.error('Error signing images for viewer:', err);
      setViewerImages(images);
      setViewerTitle(title);
      setViewerZipUrl(zipUrl);
      setViewerZipName(zipName);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div className="admin-theory-container" style={{ padding: '32px 40px', background: '#f4f7fc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
            Lý thuyết & Tài liệu PE
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý tài liệu tham khảo, bài giảng PDF, video và bộ đề thi PE có hỗ trợ trích xuất ảnh tự động.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Batch Convert ZIP button for PE */}
          {unextractedPeZips.length > 0 && (
            <button
              onClick={handleBatchExtractZip}
              disabled={batchExtracting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff',
                border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(5, 150, 105, 0.3)',
              }}
              title="Chuyển đổi toàn bộ file ZIP chưa có ảnh trực tiếp trên web"
            >
              {batchExtracting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang xử lý ({batchProgress?.current}/{batchProgress?.total})...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Trích xuất ảnh ZIP hàng loạt ({unextractedPeZips.length})</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff',
              border: 'none', borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)', transition: 'transform 0.15s ease'
            }}
          >
            <Plus size={18} /> Thêm tài liệu
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {([
          { key: 'all' as const,    label: 'Tất cả' },
          { key: 'theory' as const, label: CAT_LABEL.theory },
          { key: 'pe' as const,     label: CAT_LABEL.pe },
        ]).map(c => {
          const count = c.key === 'all' ? theories.length : theories.filter(t => getCat(t) === c.key).length;
          const active = filterCat === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilterCat(c.key)}
              style={{
                padding: '10px 20px', borderRadius: 14, cursor: 'pointer',
                border: active ? '2px solid #1d4ed8' : '1.5px solid #cbd5e1',
                background: active ? '#eff6ff' : '#ffffff',
                color: active ? '#1d4ed8' : '#475569',
                fontSize: 13.5, fontWeight: 800,
              }}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter Tabs & Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        
        {/* Subject Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4, maxWidth: '100%' }}>
          <button
            onClick={() => setFilterSubj('all')}
            style={{
              padding: '8px 18px', borderRadius: 20, border: '1px solid #cbd5e1',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
              background: filterSubj === 'all' ? '#2563eb' : '#ffffff',
              color: filterSubj === 'all' ? '#ffffff' : '#475569',
              boxShadow: filterSubj === 'all' ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
            }}
          >
            Tất cả môn ({theories.length})
          </button>
          {subjects.map(s => {
            const count = theories.filter(t => getSubjectIds(t).includes(s.id)).length;
            if (count === 0) return null;
            return (
              <button
                key={s.id}
                onClick={() => setFilterSubj(s.id)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: '1px solid #cbd5e1',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: filterSubj === s.id ? '#2563eb' : '#ffffff',
                  color: filterSubj === s.id ? '#ffffff' : '#475569',
                  boxShadow: filterSubj === s.id ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
                }}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm tiêu đề tài liệu..."
            style={{
              width: '100%', padding: '10px 34px 10px 40px', borderRadius: 14,
              border: '1.5px solid #cbd5e1', fontSize: 13.5, outline: 'none', background: '#ffffff',
              color: '#0f172a', boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: '#e2e8f0', border: 'none', borderRadius: '50%',
                width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0, color: '#475569'
              }}
              title="Xóa tìm kiếm"
            >
              <X size={11} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Theory Items */}
      {filtered.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <FileText size={44} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#475569' }}>Chưa có tài liệu nào</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 20 }}>
          {filtered.map(t => {
            const attachedSubjects = subjects.filter(s => getSubjectIds(t).includes(s.id));
            const isFile = t.type === 'file';
            const isLink = t.type === 'link';
            const isPE   = getCat(t) === 'pe';
            const isZip  = (t.file_name && t.file_name.toLowerCase().endsWith('.zip')) || (t.url && t.url.toLowerCase().includes('.zip'));

            // Parse metadata for images
            const meta = parseTheoryDescription(t.description);
            const previewImages = meta.preview_images;
            const hasImages = previewImages.length > 0;
            const isCurrentlyExtracting = extractingId === t.id;

            const badgeBg = isFile ? '#edf5ff' : isLink ? '#eafaf5' : '#f3eefd';
            const badgeColor = isFile ? '#2563eb' : isLink ? '#059669' : '#8b5cf6';
            const badgeBorder = isFile ? '#dbeafe' : isLink ? '#d1fae5' : '#ede9fe';

            return (
              <div
                key={t.id}
                style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22,
                  padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex',
                  flexDirection: 'column', justifyContent: 'space-between', gap: 14,
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Bar: Icon Type & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{
                        padding: '5px 12px', borderRadius: 16, background: badgeBg, color: badgeColor,
                        border: `1px solid ${badgeBorder}`, fontSize: 11.5, fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        <TypeIcon type={t.type} />
                        {isZip ? 'File ZIP' : t.type === 'file' ? 'File tài liệu' : t.type === 'link' ? 'Liên kết' : 'Hình ảnh'}
                      </div>
                      <div style={{
                        padding: '5px 12px', borderRadius: 16, fontSize: 11.5, fontWeight: 800,
                        background: isPE ? '#fff7ed' : '#f1f5f9',
                        color: isPE ? '#c2410c' : '#475569',
                        border: `1px solid ${isPE ? '#fed7aa' : '#e2e8f0'}`,
                      }}>
                        {CAT_LABEL[getCat(t)]}
                      </div>

                      {/* Extracted Images Badge */}
                      {hasImages && (
                        <div style={{
                          padding: '5px 12px', borderRadius: 16, fontSize: 11.5, fontWeight: 800,
                          background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                          display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          <Layers size={13} /> {previewImages.length} ảnh đề thi
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openEdit(t)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1.5px solid #cbd5e1',
                          background: '#ffffff', color: '#475569', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(t.id)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1px solid #fecdd3',
                          background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Xóa tài liệu"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {t.title}
                  </h3>

                  {/* Clean Description */}
                  {meta.description && (
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {meta.description}
                    </p>
                  )}

                  {/* Mini Filmstrip / Thumbnail Previews if has images */}
                  {hasImages && (
                    <div style={{ margin: '10px 0 12px 0' }}>
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                        {previewImages.slice(0, 4).map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => openViewer(previewImages, t.title, t.url, t.file_name)}
                            style={{
                              width: 58, height: 42, borderRadius: 8, overflow: 'hidden',
                              border: '1.5px solid #cbd5e1', cursor: 'pointer', flexShrink: 0,
                              background: '#f8fafc', position: 'relative'
                            }}
                            title={`Xem ảnh câu ${idx + 1}`}
                          >
                            <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', bottom: 1, right: 2, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 8.5, fontWeight: 800, padding: '0 3px', borderRadius: 3 }}>
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                        {previewImages.length > 4 && (
                          <button
                            onClick={() => openViewer(previewImages, t.title, t.url, t.file_name)}
                            style={{
                              width: 58, height: 42, borderRadius: 8, border: '1.5px dashed #3b82f6',
                              background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 800,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            +{previewImages.length - 4} ảnh
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div>
                  {attachedSubjects.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {attachedSubjects.map(s => (
                        <span key={s.id} style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', background: '#f1f5f9', color: '#475569', borderRadius: 8 }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    
                    {/* View Exam Images button if available */}
                    {hasImages && (
                      <button
                        onClick={() => openViewer(previewImages, t.title, t.url, t.file_name)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          width: '100%', padding: '9px', borderRadius: 12, border: '1.5px solid #a7f3d0',
                          background: '#ecfdf5', color: '#047857', fontSize: 12.5, fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={15} /> Xem {previewImages.length} ảnh đề thi
                      </button>
                    )}

                    {/* Single 1-Click ZIP Extraction button for PE files */}
                    {isPE && isZip && (
                      <button
                        onClick={() => handleExtractZipSingle(t)}
                        disabled={isCurrentlyExtracting}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          width: '100%', padding: '8px', borderRadius: 12,
                          border: hasImages ? '1px solid #fed7aa' : '1.5px solid #fdba74',
                          background: hasImages ? '#fffaf5' : '#fff7ed',
                          color: '#c2410c', fontSize: 12, fontWeight: 800, cursor: isCurrentlyExtracting ? 'not-allowed' : 'pointer'
                        }}
                        title={hasImages ? "Trích xuất lại toàn bộ ảnh từ file ZIP" : "Giải nén và trích xuất ảnh câu hỏi trực tiếp trên web"}
                      >
                        {isCurrentlyExtracting ? (
                          <>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>{extractingProgress || 'Đang xử lý...'}</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={13} />
                            <span>{hasImages ? 'Trích xuất lại từ ZIP' : '⚡ Trích xuất ảnh từ ZIP'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Open / Download original file link (always preserved) */}
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={async (e) => {
                        if (t.type === 'link') return;
                        e.preventDefault();
                        const signed = await signStorageUrl(t.url);
                        window.open(signed ?? t.url, '_blank', 'noopener');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '9px', borderRadius: 12, border: '1.5px solid #dbeafe',
                        background: '#eff6ff', color: '#2563eb', fontSize: 12.5, fontWeight: 800,
                        textDecoration: 'none', boxSizing: 'border-box'
                      }}
                    >
                      <Download size={14} /> Tải file gốc ({t.file_name || 'Tài liệu'})
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Slide-over for Add/Edit */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px, 100vw)', background: '#ffffff', boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', zIndex: 201, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 2 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {form.id ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tiêu đề tài liệu *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Đề Thi PE FER202 SP 2025 - Đề số 1" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Mô tả ngắn</label>
                <textarea style={{ ...inputStyle, height: 68, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tóm tắt nội dung tài liệu..." />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Danh mục *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['theory', 'pe'] as Category[]).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, category: c }))}
                      style={{
                        padding: '10px 8px', borderRadius: 12,
                        border: form.category === c ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                        background: form.category === c ? '#eff6ff' : '#ffffff',
                        color: form.category === c ? '#2563eb' : '#475569',
                        fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                      }}
                    >
                      {CAT_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Loại tài liệu</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {TYPE_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: opt.value }))}
                      style={{
                        padding: '10px 8px', borderRadius: 12, border: form.type === opt.value ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                        background: form.type === opt.value ? '#eff6ff' : '#ffffff', color: form.type === opt.value ? '#2563eb' : '#475569',
                        fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated PE ZIP upload section */}
              {form.category === 'pe' && form.type === 'file' && (
                <div style={{ background: '#f8fafc', border: '1.5px dashed #3b82f6', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Sparkles size={16} color="#2563eb" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>
                      Upload file ZIP đề thi PE (Tự động trích xuất ảnh)
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    File ZIP sẽ được lưu nguyên vẹn để sinh viên tải về. Đồng thời các ảnh câu hỏi bên trong sẽ được tự động trích xuất để xem trực tiếp trên web!
                  </p>

                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFormZipPicked}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => zipInputRef.current?.click()}
                    disabled={isProcessingZipInForm}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      border: '1px solid #2563eb', background: '#eff6ff',
                      color: '#1d4ed8', fontSize: 13, fontWeight: 800,
                      cursor: isProcessingZipInForm ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    {isProcessingZipInForm ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>{zipProgressText}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Chọn file ZIP đề thi (.zip)</span>
                      </>
                    )}
                  </button>

                  {/* Extracted Images Preview within Modal */}
                  {form.preview_images.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>
                          📸 Đã trích xuất {form.preview_images.length} ảnh xem trước:
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, preview_images: [] }))}
                          style={{ border: 'none', background: 'transparent', color: '#e11d48', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Xóa ảnh
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                        {form.preview_images.map((img, i) => (
                          <div key={i} style={{ width: 50, height: 38, borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standard File Uploaders */}
              {form.type === 'file' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                    File tài liệu hiện tại (PDF, Word, Excel, PPT, Zip, Video...)
                  </label>
                  <FileUploader
                    bucket="theory-files"
                    value={form.url}
                    onChange={(url) => setForm(p => ({ ...p, url }))}
                    onFileNameChange={(name) => setForm(p => ({ ...p, file_name: name || p.file_name }))}
                    accept="*/*"
                    maxSizeMB={50}
                    preview="file"
                    label="Tải file tài liệu thủ công"
                  />
                </div>
              ) : form.type === 'image' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Hình ảnh tài liệu</label>
                  <FileUploader
                    bucket="theory-files"
                    value={form.url}
                    onChange={(url) => setForm(p => ({ ...p, url }))}
                    onFileNameChange={(name) => setForm(p => ({ ...p, file_name: name || p.file_name }))}
                    accept="image/*"
                    preview="image"
                    label="Tải ảnh tài liệu"
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Đường dẫn liên kết (URL)</label>
                  <input style={inputStyle} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://drive.google.com/..." />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Thuộc môn học (chọn nhiều)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto', background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  {subjects.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#0f172a' }}>
                      <input
                        type="checkbox"
                        checked={form.subject_ids.includes(s.id)}
                        onChange={() => toggleSubject(s.id)}
                        style={{ width: 15, height: 15, accentColor: '#2563eb' }}
                      />
                      Kỳ {s.semester} · {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', bottom: 0, display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }} onClick={() => setShowForm(false)}>Hủy</button>
              <button style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={save} disabled={saving || isProcessingZipInForm}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} strokeWidth={3} />}
                {form.id ? 'Lưu thay đổi' : 'Tạo tài liệu'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Full-Screen Exam Image Viewer Modal */}
      {viewerImages && (
        <ExamImageViewerModal
          isOpen={Boolean(viewerImages)}
          onClose={() => setViewerImages(null)}
          images={viewerImages}
          title={viewerTitle}
          zipDownloadUrl={viewerZipUrl}
          zipFileName={viewerZipName}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-theory-container {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
