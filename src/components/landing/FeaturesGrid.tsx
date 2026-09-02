import React from 'react';
import { Award, Code2, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: <Award className="w-6 h-6 text-blue-600" />,
    title: 'Timed Mock Exams',
    description: 'Calibrated directly to official university matrices with 40 questions, live countdown, and score ranking.',
    tag: 'EXAM SIMULATION',
  },
  {
    icon: <Code2 className="w-6 h-6 text-cyan-600" />,
    title: 'PE Practical Coding',
    description: 'Hands-on programming labs with starter zip files, automated unit tests, and verified full-score sample solutions.',
    tag: 'HANDS-ON CODING',
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6 text-indigo-600" />,
    title: 'Theory CheatSheets',
    description: '1-page condensed memory sheets summarizing an entire 15-week semester into essential printable points.',
    tag: '1-PAGE PRINTABLE',
  },
  {
    icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
    title: 'Instant Scoring & Explanations',
    description: 'Clear step-by-step reasoning for every answer option so you understand why the right answer is correct.',
    tag: 'DEEP DIVE',
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-16 lg:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Designed specifically for university exam success
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
                <span>Standard Feature</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
