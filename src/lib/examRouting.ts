/**
 * examRouting.ts
 * Logic phân loại đề thi thành Text Exam (Dedicated modern text exam layout)
 * hoặc Image Exam (Giao diện đề thi ảnh ôm sát / screenshot).
 */

export interface RoutingQuestion {
  image_url?: string | null;
  content?: string | null;
  options?: Array<{ content?: string | null }>;
}

export function checkIsTextExam(questions: RoutingQuestion[]): boolean {
  if (!questions || questions.length === 0) return false;

  // 1. Nếu bất kỳ câu hỏi nào có options chứa nội dung text (đặc trưng của đề Word, Markdown, Text)
  // thì ĐÂY CHẮC CHẮN LÀ ĐỀ TEXT, vì đề thi ảnh không bao giờ có text trong options.
  const hasTextOptions = questions.some(q =>
    q.options && q.options.some(o => !!o.content?.trim())
  );
  if (hasTextOptions) return true;

  // 2. Đề thi hoàn toàn không có ảnh
  const imageQuestionCount = questions.filter(q => !!q.image_url).length;
  if (imageQuestionCount === 0) return true;

  // 3. Ít hơn 50% câu hỏi có ảnh VÀ câu hỏi có nội dung văn bản
  const hasQuestionContent = questions.some(q => !!q.content?.trim());
  if (imageQuestionCount < questions.length / 2 && hasQuestionContent) {
    return true;
  }

  // Mặc định là đề thi ảnh (ví dụ: đề chụp màn hình FUOverflow 100% là ảnh, options rỗng text)
  return false;
}
