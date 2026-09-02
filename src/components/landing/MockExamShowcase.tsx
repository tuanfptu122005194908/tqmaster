import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function MockExamShowcase() {
  const [selectedOption, setSelectedOption] = useState<string | null>('B');
  const [showExplanation, setShowExplanation] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(2895); // ~48:15

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const options = [
    { id: 'A', text: 'P ' },
    { id: 'B', text: 'C ' },
    { id: 'C', text: 'P C ' },
    { id: 'D', text: 'Compilation error: cannot instantiate Child as Parent' },
  ];

  return (
    <section id="mock-exam" className="py-20 lg:py-28 bg-slate-50/70 border-y border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Award size={13} className="text-blue-600" />
            <span>Realistic University Exam Simulator</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Practice like it's the real thing.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Timed exams. Instant scoring. Detailed explanations. Never walk into an exam hall
            surprised by the interface or the questions.
          </p>
        </div>

        {/* The Realistic Exam Simulation Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-[0_12px_45px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Top Exam Status Bar */}
          <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold tracking-tight">
                PRO192 — Mock Exam #01 (Final Simulation)
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• 40 Questions</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Live Timer */}
              <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-mono font-bold text-amber-400">
                <Clock size={15} />
                <span>{formatTimer(secondsLeft)}</span>
              </div>

              <div className="text-xs text-slate-400 font-medium hidden md:block">
                Question <strong className="text-white">12</strong> of 40
              </div>
            </div>
          </div>

          {/* Progress Bar (Question 12 of 40 = 30%) */}
          <div className="w-full bg-slate-100 h-1.5">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyan-500 h-1.5 transition-all duration-300"
              style={{ width: '30%' }}
            />
          </div>

          {/* Exam Content Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-md border border-blue-200">
                  QUESTION 12 / 40
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Multiple Choice • Single Answer
                </span>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600">
                <Flag size={14} />
                <span>Flag for review</span>
              </button>
            </div>

            {/* Question Prompt */}
            <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              What is the output of this Java program?
            </div>

            {/* Code Block Snippet */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs sm:text-sm leading-relaxed shadow-inner">
              <div className="flex gap-4">
                <div className="select-none text-slate-500 text-right pr-2 border-r border-slate-800 space-y-1">
                  <div>1</div>
                  <div>2</div>
                  <div>3</div>
                  <div>4</div>
                  <div>5</div>
                  <div>6</div>
                  <div>7</div>
                  <div>8</div>
                  <div>9</div>
                  <div>10</div>
                  <div>11</div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-purple-400">class</span> <span className="text-amber-300">Parent</span> &#123;</div>
                  <div className="pl-4"><span className="text-purple-400">void</span> <span className="text-blue-400">show</span>() &#123; System.out.print(<span className="text-emerald-300">"P "</span>); &#125;</div>
                  <div>&#125;</div>
                  <div><span className="text-purple-400">class</span> <span className="text-amber-300">Child</span> <span className="text-purple-400">extends</span> <span className="text-amber-300">Parent</span> &#123;</div>
                  <div className="pl-4"><span className="text-blue-400">@Override</span></div>
                  <div className="pl-4"><span className="text-purple-400">void</span> <span className="text-blue-400">show</span>() &#123; System.out.print(<span className="text-emerald-300">"C "</span>); &#125;</div>
                  <div>&#125;</div>
                  <div><span className="text-purple-400">public class</span> <span className="text-amber-300">PolymorphismDemo</span> &#123;</div>
                  <div className="pl-4"><span className="text-purple-400">public static void</span> <span className="text-blue-400">main</span>(String[] args) &#123;</div>
                  <div className="pl-8"><span className="text-amber-300">Parent</span> obj = <span className="text-purple-400">new</span> <span className="text-amber-300">Child</span>();</div>
                  <div className="pl-8">obj.show();</div>
                  <div className="pl-4">&#125;</div>
                  <div>&#125;</div>
                </div>
              </div>
            </div>

            {/* Answer Choices */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select one answer:
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrect = opt.id === 'B';
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedOption(opt.id);
                        setShowExplanation(true);
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? isCorrect
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-400'
                            : 'bg-rose-50 border-rose-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="font-mono text-sm text-slate-800 font-semibold">
                          {opt.text}
                        </span>
                      </div>

                      {isSelected && isCorrect && (
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Correct
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Explanation Drawer */}
            {showExplanation && (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-1.5">
                  <Sparkles size={15} className="text-blue-600" />
                  <span>DETAILED EXPLANATION</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  In Java, non-static method calls are resolved <strong>polymorphically at runtime</strong> (via dynamic dispatch) based on the actual object type in memory (<code className="font-mono bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-700">Child</code>), not the reference type (<code className="font-mono bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-700">Parent</code>). Therefore, <code className="font-mono text-emerald-700 font-bold">Child.show()</code> is executed, printing <code className="font-mono font-bold">"C "</code>.
                </p>
              </div>
            )}

            {/* Question Quick Grid (1..40) */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>QUESTION PALETTE:</span>
                <span className="font-semibold text-slate-600">11 Answered • 1 Current • 28 Remaining</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 20 }).map((_, i) => {
                  const num = i + 1;
                  const isCurrent = num === 12;
                  const isAnswered = num < 12;
                  return (
                    <button
                      key={num}
                      className={`w-7 h-7 rounded-md text-[11px] font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : isAnswered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
                <span className="text-xs text-slate-400 self-center px-1 font-mono">... 40</span>
              </div>
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                <span>Next</span>
                <ArrowRight size={14} />
              </button>

              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                }}
              >
                <span>Submit Exam</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
