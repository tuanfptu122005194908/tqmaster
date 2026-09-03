import React from 'react';
import { Award, Code2, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: <Award className="w-6 h-6 text-blue-600" />,
    title: 'Thi thử bấm giờ chuẩn ma trận',
    description: 'Bám sát 100% đề thi chính thức với 40 câu hỏi, đồng hồ đếm ngược thời gian thực và phân tích xếp hạng điểm.',
    tag: 'MÔ PHỎNG THI THẬT',
  },
  {
    icon: <Code2 className="w-6 h-6 text-cyan-600" />,
    title: 'Luyện thi thực hành PE',
    description: 'Bài tập lập trình thực chiến kèm file starter zip, kịch bản unit test tự động và bài giải mẫu đạt điểm tuyệt đối 10/10.',
    tag: 'CODE THỰC HÀNH',
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6 text-indigo-600" />,
    title: 'Tóm tắt lý thuyết CheatSheet',
    description: 'Cô đọng toàn bộ kiến thức 15 tuần học của học kỳ vào tài liệu 1 trang in ấn, giúp ôn tập cấp tốc trước giờ thi.',
    tag: 'TÀI LIỆU 1 TRANG',
  },
  {
    icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
    title: 'Chấm điểm & Giải thích tức thì',
    description: 'Phân tích chi tiết từng phương án đúng - sai kèm lý do cụ thể, giúp bạn hiểu sâu bản chất vấn đề và tránh bẫy thi.',
    tag: 'GIẢI THÍCH CHI TIẾT',
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-16 lg:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <span>Năng lực cốt lõi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Thiết kế chuyên biệt cho mục tiêu đạt điểm cao
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-white rounded-xl border border-slate-100 w-fit mb-4 shadow-2xs">
                  {item.icon}
                </div>
                <div className="text-[10px] font-extrabold tracking-wider text-blue-600 mb-1">
                  {item.tag}
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={13} />
                <span>Tính năng tiêu chuẩn</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
