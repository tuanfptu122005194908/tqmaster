import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Zap, ShieldCheck, Award, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import KnowledgeCoreScene, { SubjectNodeData } from '@/components/landing3d/KnowledgeCoreScene';

interface LandingHeroProps {
  onExploreSubjects: () => void;
}

export default function LandingHero({ onExploreSubjects }: LandingHeroProps) {
  const navigate = useNavigate();

  const handleSelectSubject = (_node: SubjectNodeData) => {
    const element = document.getElementById('subjects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-72px)] flex items-center bg-white overflow-hidden pt-8 pb-16 lg:py-20">
      {/* Background Tech Elements: Dot Grid & Soft Radial Gradients */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient radial lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT: Marketing Content */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-7 text-left"
          >
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-2xs text-slate-800 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>University Exam Preparation • FPT SE & IT</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                STOP SEARCHING.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600">
                  START STUDYING.
                </span>
              </h1>
            </div>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
              Everything you need to prepare for university exams —{' '}
              <strong className="text-slate-800 font-semibold">Mock Exams</strong>,{' '}
              <strong className="text-slate-800 font-semibold">PE Practice</strong>,{' '}
              <strong className="text-slate-800 font-semibold">Cheat Sheets</strong> and{' '}
              <strong className="text-slate-800 font-semibold">Flashcards</strong> — organized by
              subject and semester.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-bold text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  boxShadow: '0 8px 22px rgba(37, 99, 235, 0.35)',
                }}
              >
                <span>Start Learning</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={onExploreSubjects}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all cursor-pointer"
              >
                <Compass size={18} className="text-blue-600" />
                <span>Explore Subjects</span>
              </button>
            </div>

            {/* Small Supporting Promise Statement */}
            <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold pt-1">
              <Zap size={16} className="text-amber-500 fill-amber-500" />
              <span>From landing to studying under 3 minutes.</span>
            </div>

            {/* Micro Trust Stats */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 sm:gap-6">
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  10,000+
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Exam Questions
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  50+
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  FPT Specialized Packs
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  99.6%
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Pass Rate
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Interactive Three.js Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative flex flex-col items-center justify-center"
          >
            {/* 3D Canvas Box */}
            <div className="w-full relative rounded-3xl bg-gradient-to-b from-slate-50/70 to-white/90 border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.03)] backdrop-blur-sm p-2 sm:p-4">
              {/* Scene HUD Hint */}
              <div className="absolute top-4 left-5 right-5 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>3D Knowledge Core</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Hover node to inspect • Click to focus
                </div>
              </div>

              {/* R3F Scene */}
              <KnowledgeCoreScene onSelectSubject={handleSelectSubject} />

              {/* Bottom Subject Pills Preview */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  10 Core FPT Subjects:
                </span>
                <span className="font-mono text-[11px] text-blue-600 font-bold truncate max-w-[280px]">
                  PRF192 • PRO192 • MAD101 • CSD201 • DBI202 ...
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
