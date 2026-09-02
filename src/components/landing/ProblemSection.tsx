import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  MessageSquare,
  HardDrive,
  Camera,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shuffle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function ProblemSection() {
  const [isOrganized, setIsOrganized] = useState(false);

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50/60 border-y border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={13} className="text-rose-600" />
            <span>The Traditional University Struggle</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Your exam preparation shouldn't look like this.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Before exams, students spend up to 70% of their time searching across 10 different
            folders, expired Drive links, and messy chat threads instead of actual studying.
          </p>

          {/* Interactive Toggle Button */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setIsOrganized(!isOrganized)}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-extrabold transition-all shadow-sm cursor-pointer border"
              style={{
                backgroundColor: isOrganized ? '#eff6ff' : '#ffffff',
                borderColor: isOrganized ? '#3b82f6' : '#cbd5e1',
                color: isOrganized ? '#1d4ed8' : '#334155',
              }}
            >
              <Shuffle size={16} className={isOrganized ? 'text-blue-600 animate-spin' : 'text-slate-500'} />
              <span>
                {isOrganized
                  ? 'Viewing: TQMaster Organized Mode'
                  : 'Click to Organize into TQMaster'}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Comparison Grid / Animation Area */}
        <div className="relative min-h-[460px] flex items-center justify-center">
          {!isOrganized ? (
            /* STATE A: Scattered Messy Materials */
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-all duration-500 animate-in fade-in">
              {/* Item 1: Drive Link 404 */}
              <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm relative rotate-[-2deg] hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-2">
                  <HardDrive size={15} />
                  <span>Google Drive Link (Broken)</span>
                </div>
                <div className="font-semibold text-slate-800 text-sm mb-1">
                  Tai_lieu_PRO192_FA22_Final.rar
                </div>
                <div className="text-xs text-rose-500 bg-rose-50 p-2 rounded-lg font-mono">
                  ⚠️ "Access Denied: You need permission or link expired"
                </div>
              </div>

              {/* Item 2: Blurry Screenshot */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm relative rotate-[2deg] hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-2">
                  <Camera size={15} />
                  <span>Screenshot Chụp Màn Hình Điện Thoại</span>
                </div>
                <div className="font-semibold text-slate-800 text-sm mb-1">
                  De_thi_chua_ro_chu.jpg
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                  Ảnh mờ nhòe, thiếu câu hỏi 15 đến 22, không có đáp án giải thích.
                </div>
              </div>

              {/* Item 3: Chaotic Chat Message */}
              <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-sm relative rotate-[-1deg] hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-600 mb-2">
                  <MessageSquare size={15} />
                  <span>Zalo / Messenger Chat</span>
                </div>
                <div className="font-semibold text-slate-800 text-sm mb-1">
                  Group Cóc K18 Ôn Thi
                </div>
                <div className="text-xs text-slate-600 bg-sky-50/60 p-2 rounded-lg">
                  "Ae ai có đáp án chuẩn câu 32 PE PRO192 k? Mỗi người giải ra 1 kiểu hoang mang quá..."
                </div>
              </div>

              {/* Item 4: Outdated 2019 Word Doc */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative rotate-[1.5deg] hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                  <FileText size={15} />
                  <span>Outdated Word Document</span>
                </div>
                <div className="font-semibold text-slate-800 text-sm mb-1">
                  De_Cuong_PRO192_2018_v3.docx
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                  Format thi cũ 30 câu (chương trình hiện tại 40 câu + PE thực hành).
                </div>
              </div>

              {/* Item 5: Scattered Drive Folders */}
              <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm relative rotate-[-2.5deg] hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-2">
                  <Layers size={15} />
                  <span>150 File Lộn Xộn Không Phân Loại</span>
                </div>
                <div className="font-semibold text-slate-800 text-sm mb-1">
                  Folder "Tổng hợp mọi thứ"
                </div>
                <div className="text-xs text-slate-500 bg-purple-50/60 p-2 rounded-lg">
                  Trộn lẫn lab, slide thầy cô, đề thi thử và tài liệu không liên quan.
                </div>
              </div>

              {/* Item 6: Disorganized Hand Notes */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative rotate-[2deg] hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-2">
                  <FileText size={15} />
                  <span>Ghi Chú Vở Viết Tay Cắt Góc</span>
                </div>
                <div className="font-semibold text-slate-800 text-sm mb-1">
                  Cong_thuc_OOP.pdf
                </div>
                <div className="text-xs text-slate-500 bg-emerald-50/50 p-2 rounded-lg">
                  Thiếu định nghĩa Abstract class vs Interface, công thức bị ghi sai.
                </div>
              </div>
            </div>
          ) : (
            /* STATE B: Organized into TQMaster Unified System */
            <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-3xl border border-blue-200 shadow-[0_12px_40px_rgba(37,99,235,0.08)] transition-all duration-500 animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                    TQ
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">
                        PRO192 — Object-Oriented Programming
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        VERIFIED 2025
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Standard FPT SE / IT Exam Preparation Pack • Kỳ 2
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400">STATUS:</span>
                  <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 justify-end">
                    <CheckCircle2 size={16} />
                    <span>Complete Study Pack</span>
                  </div>
                </div>
              </div>

              {/* Unified 4 Modules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all">
                  <div className="text-xs font-bold text-blue-600 mb-1">01 MOCK EXAMS</div>
                  <div className="text-sm font-extrabold text-slate-900">12 Timed Tests</div>
                  <div className="text-xs text-slate-500 mt-1">40 Qs each • Instant score & KaTeX explanations</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all">
                  <div className="text-xs font-bold text-cyan-600 mb-1">02 PE PRACTICE</div>
                  <div className="text-sm font-extrabold text-slate-900">8 Lab Scenarios</div>
                  <div className="text-xs text-slate-500 mt-1">Starter code • Test runner • Clean architecture</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all">
                  <div className="text-xs font-bold text-indigo-600 mb-1">03 CHEATSHEET</div>
                  <div className="text-sm font-extrabold text-slate-900">1-Page High Yield</div>
                  <div className="text-xs text-slate-500 mt-1">Key syntax • Diagrams • Printable PDF</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all">
                  <div className="text-xs font-bold text-amber-600 mb-1">04 FLASHCARDS</div>
                  <div className="text-sm font-extrabold text-slate-900">120 Terms & Rules</div>
                  <div className="text-xs text-slate-500 mt-1">Spaced repetition • 10-minute speed drill</div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Verified against official university exam matrices. No missing questions.</span>
                </div>
                <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
                  <span>Ready to start in 3 minutes</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Final Message */}
        <div className="text-center mt-12 space-y-2">
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            One platform. One subject. Everything you need.
          </div>
          <p className="text-sm text-slate-500">
            Never again ask "Where can I find materials for this subject?"
          </p>
        </div>
      </div>
    </section>
  );
}
