import React from 'react';
import { ArrowRight, Compass, PackageCheck, PlayCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ThreeStepProcess() {
  const navigate = useNavigate();

  const steps = [
    {
      step: '01',
      time: '~30 SECONDS',
      title: 'Choose your subject',
      description:
        'Browse our curated course library by semester. Filter by course codes like PRF192, PRO192, or CSD201.',
      icon: <Compass className="w-6 h-6 text-blue-600" />,
      accent: 'border-blue-500 text-blue-600',
    },
    {
      step: '02',
      time: '~60 SECONDS',
      title: 'Get the complete study pack',
      description:
        'Access all verified mock exams, PE lab scenarios, 1-page theory cheat sheets, and active flashcards in one click.',
      icon: <PackageCheck className="w-6 h-6 text-cyan-600" />,
      accent: 'border-cyan-500 text-cyan-600',
    },
    {
      step: '03',
      time: '~90 SECONDS',
      title: 'Start practicing',
      description:
        'Launch a timed exam simulation or review tricky questions. Instant automatic scoring and step-by-step explanations.',
      icon: <PlayCircle className="w-6 h-6 text-indigo-600" />,
      accent: 'border-indigo-500 text-indigo-600',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Zap size={13} className="text-blue-600" />
            <span>Fast-Track Workflow</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            From landing to studying under 3 minutes.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal">
            No endless registration forms, no waiting for file approvals, no broken links.
          </p>
        </div>

        {/* Clean Horizontal 3-Step Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Subtle horizontal connecting line on desktop */}
          <div className="hidden md:block absolute top-1/3 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-200 via-cyan-200 to-indigo-200 -z-0" />

          {steps.map((item, idx) => (
            <div
              key={item.step}
              className="relative z-10 bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Step Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-sm text-slate-800 border border-slate-200">
                      {item.step}
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-400">
                      {item.time}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    {item.icon}
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2.5">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Step {idx + 1} of 3</span>
                <span className="text-blue-600 flex items-center gap-1">
                  Ready <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Central Bottom Action */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
            }}
          >
            <span>Start Your 3-Minute Setup</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
