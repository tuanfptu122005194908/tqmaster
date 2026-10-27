import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { sortExams } from '@/lib/utils';
import { parseTheoryDescription } from '@/lib/theoryMetadata';
import { signStorageUrls } from '@/lib/signedImage';

export type SubjectTab = 'exams' | 'exams_pt' | 'theory' | 'pe' | 'announcements' | 'reviews';
type Document = Tables<'theories'>;
interface ContentScope {
  userId: string | null;
  isAdmin: boolean;
  accessRevision: number;
  canRead: boolean;
}

function requireData<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('Không nhận được dữ liệu môn học.');
  return result.data;
}

async function loadDocuments(subjectId: string, category: 'theory' | 'pe', signal: AbortSignal) {
  const result = await supabase.from('theory_subjects')
    .select('theory_id, theories!inner(*)')
    .eq('subject_id', subjectId).eq('theories.category', category).abortSignal(signal);
  return requireData(result).map(row => row.theories).filter((row): row is Document => !!row);
}

function displayDocuments(rows: Document[], signed?: Map<string, string>) {
  return rows.map(row => {
    const meta = parseTheoryDescription(row.description);
    return {
      ...row, clean_description: meta.description, preview_images: meta.preview_images,
      preview_display_images: meta.preview_images.map(image => signed?.get(image)),
    };
  });
}

/** Short-lived, account-owned cache. Cached content never grants server access. */
export function useSubjectContent(subjectId: string | undefined, tab: SubjectTab, scope: ContentScope) {
  const key = ['user', scope.userId, 'subject', subjectId, scope.isAdmin] as const;
  const contentKey = [...key, 'content', scope.accessRevision, scope.canRead] as const;
  const enabled = !!scope.userId && !!subjectId;
  const metadata = useQuery({
    queryKey: [...key, 'metadata'], enabled,
    queryFn: async ({ signal }) => requireData(await supabase.from('subjects')
      .select('*').eq('id', subjectId!).abortSignal(signal).single()),
  });
  const unlocked = enabled && scope.canRead && metadata.isSuccess;
  const exams = useQuery({
    queryKey: [...contentKey, 'exams'], enabled: unlocked && (tab === 'exams' || tab === 'exams_pt'),
    queryFn: async ({ signal }) => {
      const rows = requireData(await supabase.from('exam_subjects').select('exam_id, exams(*)')
        .eq('subject_id', subjectId!).abortSignal(signal));
      return sortExams(rows.map(row => row.exams).filter((row): row is Tables<'exams'> => !!row));
    },
  });
  const theory = useQuery({
    queryKey: [...contentKey, 'documents', 'theory'], enabled: unlocked && tab === 'theory',
    queryFn: ({ signal }) => loadDocuments(subjectId!, 'theory', signal),
  });
  const pe = useQuery({
    queryKey: [...contentKey, 'documents', 'pe'], enabled: unlocked && tab === 'pe',
    queryFn: ({ signal }) => loadDocuments(subjectId!, 'pe', signal),
  });
  const announcements = useQuery({
    queryKey: [...contentKey, 'announcements'], enabled: enabled && metadata.isSuccess && tab === 'announcements',
    queryFn: async ({ signal }) => requireData(await supabase.from('announcements').select('*')
      .eq('subject_id', subjectId!).order('created_at', { ascending: false }).abortSignal(signal)),
  });
  const documents = tab === 'pe' ? pe : theory;
  const previews = useQuery({
    queryKey: [...contentKey, 'previews', tab], retry: false,
    enabled: unlocked && (tab === 'theory' || tab === 'pe') && documents.isSuccess,
    queryFn: async ({ signal }) => {
      if (signal.aborted) throw new DOMException('Đã hủy tải ảnh.', 'AbortError');
      const urls = (documents.data ?? []).flatMap(row => parseTheoryDescription(row.description).preview_images);
      const signed = urls.length ? await signStorageUrls(urls) : new Map<string, string>();
      if (signal.aborted) throw new DOMException('Đã hủy tải ảnh.', 'AbortError');
      return signed;
    },
  });
  const selected = tab === 'exams' || tab === 'exams_pt' ? exams
    : tab === 'theory' ? theory : tab === 'pe' ? pe : tab === 'announcements' ? announcements : null;
  const selectedEnabled = tab === 'announcements' ? enabled && metadata.isSuccess : unlocked;

  return {
    metadata, exams, theory, pe, announcements,
    subject: enabled ? metadata.data : undefined,
    examRows: unlocked ? exams.data ?? [] : [],
    theoryDocs: unlocked ? displayDocuments(theory.data ?? [], tab === 'theory' ? previews.data : undefined) : [],
    peDocs: unlocked ? displayDocuments(pe.data ?? [], tab === 'pe' ? previews.data : undefined) : [],
    announcementRows: enabled ? announcements.data ?? [] : [],
    tabLoading: !!selected && selectedEnabled && selected.isPending,
    tabError: selectedEnabled ? selected?.error : null,
    retryTab: () => selected?.refetch(),
  };
}
