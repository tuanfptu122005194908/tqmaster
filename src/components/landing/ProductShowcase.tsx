import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Code2,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Sparkles,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductShowcase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'mock' | 'pe' | 'theory'>('mock');
  const [selectedOption, setSelectedOption] = useState<string | null>('B');
  const [showExplanation, setShowExplanation] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(2895);

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
    <section id="showcase" className="py-20 lg:py-28 bg-slate-50/60 border-y border-slate-200/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} className="text-blue-600" />
            <span>Interactive Platform Preview</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Everything you need for your course in one view.
          </h2>

          <p className="text-base text-slate-600 font-normal">
            Try the live simulator below — experience real university exam conditions with instant grading.
          </p>
        </motion.div>

        {/* The Realistic Dashboard Container with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden"
        >
          {/* Top Course Header Bar */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                PRO
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    PRO192 — Object-Oriented Programming (Java)
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/40 rounded-full">
                    KỲ 2 • FPT SE & IT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  12 Full Mock Exams • 8 PE Lab Scenarios • 1-Page Theory CheatSheet
                </p>
              </div>
            </div>

            {/* Quick Live Timer */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs font-bold text-amber-400">
                <Clock size={14} />
                <span>{formatTimer(secondsLeft)}</span>
              </div>
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                Start Full Exam
              </button>
            </div>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 gap-2">
            <button
              onClick={() => setActiveTab('mock')}
              className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'mock'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen size={16} />
              <span>01 Mock Exam Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('pe')}
              className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pe'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 size={16} />
              <span>02 PE Practice (Lab)</span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'theory'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>03 Theory CheatSheet</span>
            </button>
          </div>

          {/* Content Area with Fluid Transition */}
          <div className="p-6 sm:p-8 min-h-[360px]">
            <AnimatePresence mode="wait">
              {/* TAB 01: MOCK EXAM SIMULATOR */}
              {activeTab === 'mock' && (
                <motion.div
                  key="tab-mock"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Question Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-md border border-blue-200">
                        QUESTION 12 / 40
                      </span>
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        Topic: Dynamic Dispatch & Polymorphism
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Click an option to test instant scoring
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-base font-bold text-slate-900">
                    What is the output of this Java program?
                  </div>

                  {/* Code Block Snippet */}
                  <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs sm:text-sm leading-relaxed">
                    <div className="flex gap-4">
                      <div className="select-none text-slate-600 text-right pr-2 border-r border-slate-800 space-y-1 text-xs">
                        <div>1</div>
                        <div>2</div>
                        <div>3</div>
                        <div>4</div>
                        <div>5</div>
                        <div>6</div>
                        <div>7</div>
                        <div>8</div>
                      </div>
                      <div className="space-y-1">
                        <div><span className="text-purple-400">class</span> <span className="text-amber-300">Parent</span> &#123; <span className="text-purple-400">void</span> <span className="text-blue-400">show</span>() &#123; System.out.print(<span className="text-emerald-300">"P "</span>); &#125; &#125;</div>
                        <div><span className="text-purple-400">class</span> <span className="text-amber-300">Child</span> <span className="text-purple-400">extends</span> <span className="text-amber-300">Parent</span> &#123;</div>
                        <div className="pl-4"><span className="text-purple-400">@Override void</span> <span className="text-blue-400">show</span>() &#123; System.out.print(<span className="text-emerald-300">"C "</span>); &#125;</div>
                        <div>&#125;</div>
                        <div><span className="text-purple-400">public class</span> <span className="text-amber-300">Demo</span> &#123;</div>
                        <div className="pl-4"><span className="text-purple-400">public static void</span> <span className="text-blue-400">main</span>(String[] args) &#123;</div>
                        <div className="pl-8"><span className="text-amber-300">Parent</span> obj = <span className="text-purple-400">new</span> <span className="text-amber-300">Child</span>(); obj.show();</div>
                        <div className="pl-4">&#125; &#125;</div>
                      </div>
                    </div>
                  </div>

                  {/* Answer Choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? isCorrect
                                ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400'
                                : 'bg-rose-50 border-rose-400'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="font-mono text-xs sm:text-sm text-slate-800 font-semibold">
                              {opt.text}
                            </span>
                          </div>

                          {isSelected && isCorrect && (
                            <span className="text-[11px] font-extrabold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 size={13} /> Correct
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation Box */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs sm:text-sm text-slate-700 leading-relaxed overflow-hidden"
                      >
                        <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-blue-600" />
                          <span>Answer Explanation</span>
                        </div>
                        In Java, method calls are resolved polymorphically at runtime via Dynamic Method Dispatch based on the actual object in memory (<code className="font-mono text-blue-700 font-bold bg-white px-1 py-0.5 rounded">Child</code>), not the reference type. Therefore, <code className="font-mono text-emerald-700 font-bold">Child.show()</code> executes and outputs <code className="font-mono font-bold">"C "</code>.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* TAB 02: PE PRACTICE */}
              {activeTab === 'pe' && (
                <motion.div
                  key="tab-pe"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="text-sm font-bold text-slate-900">
                    Practical Exam (PE) Real Coding Scenarios
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-xs font-bold text-blue-600 mb-1">PAPER #01 (100 MINS)</div>
                      <div className="font-bold text-slate-900 text-sm mb-2">Car Management (OOP & Collections)</div>
                      <p className="text-xs text-slate-600 mb-3">
                        Includes NetBeans starter source code, test data files, and automated EOS evaluation scripts.
                      </p>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        Verified 10/10 Solution Included
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-xs font-bold text-blue-600 mb-1">PAPER #02 (100 MINS)</div>
                      <div className="font-bold text-slate-900 text-sm mb-2">Student Records & File Serialization</div>
                      <p className="text-xs text-slate-600 mb-3">
                        Covers custom exceptions, binary file reading, and sorting with java.util.Comparator.
                      </p>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        Full Step-by-Step Guide
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 03: THEORY CHEATSHEET */}
              {activeTab === 'theory' && (
                <motion.div
                  key="tab-theory"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-slate-900">
                      1-Page High-Yield CheatSheet
                    </div>
                    <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer">
                      <Download size={13} /> Download Printable PDF
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="font-bold text-slate-900 mb-1">4 OOP Pillars</div>
                      <p className="text-slate-600">Encapsulation, Inheritance, Polymorphism, Abstraction.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="font-bold text-slate-900 mb-1">Access Modifiers</div>
                      <p className="text-slate-600">public &gt; protected &gt; default (package) &gt; private.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="font-bold text-slate-900 mb-1">Exam Trap</div>
                      <p className="text-slate-600">Constructors are NEVER inherited. == compares references.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
