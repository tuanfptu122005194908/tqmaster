import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'TQMaster có sát với format đề thi thực tế tại trường không?',
    answer:
      'Có. 100% đề thi thử và bộ đề PE trên TQMaster được xây dựng bám sát theo ma trận đề thi chính thức của từng kỳ học (bao gồm số lượng câu hỏi, thời gian bấm giờ 60 phút, tỷ trọng các chương và dạng câu hỏi bẫy thường gặp).',
  },
  {
    question: 'Bộ đề PE (Practical Exam) có kèm theo source code mẫu và test case không?',
    answer:
      'Có. Mỗi đề PE đều bao gồm file starter code (.zip), đề bài chi tiết, các test case kiểm thử và hướng dẫn giải từng bước đạt điểm tối đa (10/10) theo chuẩn chấm thi tự động.',
  },
  {
    question: 'Tôi có thể xem lại đáp án và giải thích chi tiết sau khi làm bài thi thử không?',
    answer:
      'Hoàn toàn được. Ngay sau khi nộp bài, hệ thống sẽ trả về điểm số, phân tích phần trăm trả lời đúng theo từng chương kiến thức và hiển thị giải thích chi tiết cho từng câu hỏi (vì sao đáp án đó đúng và tại sao các phương án còn lại sai).',
  },
  {
    question: 'CheatSheet và Flashcards có hỗ trợ xem trên điện thoại không?',
    answer:
      'Có. Giao diện TQMaster được tối ưu hoàn toàn cho thiết bị di động (responsive). Bạn có thể lướt nhanh 25 thẻ ghi nhớ flashcards hoặc tải bản PDF 1 trang tóm tắt công thức ngay trước giờ vào phòng thi.',
  },
  {
    question: 'Nền tảng hỗ trợ những môn học nào?',
    answer:
      'TQMaster tập trung vào toàn bộ các môn chuyên ngành của khối ngành Kỹ thuật phần mềm (SE) và Công nghệ thông tin (IT) từ Kỳ 1 đến Kỳ 9: PRF192, PRO192, MAD101, CSD201, DBI202, OSG202, CEA201, MAS291, SWE201c, PRJ301, PRN211, PRN231 và nhiều môn khác.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-slate-50/50 border-b border-slate-200/80 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={13} className="text-blue-600" />
            <span>Giải đáp thắc mắc</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Câu hỏi thường gặp
          </h2>

          <p className="text-base text-slate-600 font-normal">
            Mọi điều bạn cần biết về lộ trình ôn thi hiệu quả cùng TQMaster.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm transition-all overflow-hidden"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-extrabold text-slate-900 text-base sm:text-lg hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
