import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import AmbientBackgroundCore from '@/components/landing3d/AmbientBackgroundCore';

export default function FinalCtaSection({
  onExploreSubjects,
}: {
  onExploreSubjects: () => void;
}) {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-slate-50 border-b border-slate-200">
      {/* 3D Knowledge Core Ambient Background Object */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <AmbientBackgroundCore className="w-[550px] h-[550px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        {/* Top Mini Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200 shadow-sm text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={13} className="text-blue-600" />
          <span>Prepare with Confidence</span>
        </div>

        {/* Big Headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
          Your next exam starts here.
        </h2>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
          Stop wasting time searching for materials. Join thousands of Software Engineering and IT
          students preparing with verified exam packs.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            }}
          >
            <span>Start Learning</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onExploreSubjects}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Compass size={18} className="text-blue-600" />
            <span>Explore Subjects</span>
          </button>
        </div>

        {/* Small reassurance bullet points */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Instant access after login
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            100% University syllabus match
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-500" />
            Free introductory practice exams
          </span>
        </div>
      </div>
    </section>
  );
}
