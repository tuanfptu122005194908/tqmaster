import React from 'react';
import { GitBranch, Sparkles, Database, Layers, ArrowDown } from 'lucide-react';
import KnowledgeNetworkScene from '@/components/landing3d/KnowledgeNetworkScene';

export default function KnowledgeNetworkSection() {
  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider">
            <GitBranch size={13} className="text-cyan-600" />
            <span>Structured Taxonomy Graph</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Not a collection of files.
            <br />
            An organized learning system.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Every question in TQMaster maps back to a specific topic, subject, and semester.
            Practice with clarity instead of guessing what will appear on the final exam.
          </p>
        </div>

        {/* 5-Step Pipeline Breadcrumb */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap max-w-4xl mx-auto mb-8 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
            <span>SEMESTER</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
            <span>SUBJECT</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
            <span>TOPIC</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <span>QUESTION</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span>EXAM</span>
          </div>
        </div>

        {/* 3D Knowledge Network Canvas Container */}
        <div className="w-full relative rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-4 sm:p-6 overflow-hidden">
          <div className="absolute top-4 left-6 z-10 flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/90 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Interactive 3D Knowledge Graph • Hover nodes to explore taxonomy</span>
          </div>

          <KnowledgeNetworkScene />

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              <strong className="text-slate-700">Hierarchy Depth:</strong> 5 Verified Levels from University Course Codes to Individual Exam Test Cases.
            </div>
            <div className="text-blue-600 font-semibold">
              Updated for Spring 2026 Academic Term
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
