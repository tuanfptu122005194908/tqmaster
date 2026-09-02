import React, { useState } from 'react';
import { Clock, CheckCircle2, ArrowRight, Zap, Target, BookOpen, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TimeBasedStudySection() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<number>(0);

  const timeOptions = [
    {
      time: '60 MINUTES',
      tag: 'Full Exam Simulation',
      title: 'Complete Mock Exam',
      description:
        'Standard 40 questions under timed test conditions. Identifies your exact score and weak topics before the actual exam.',
      idealFor: '1–2 days before exam',
      features: [
        'Realistic countdown timer',
        'Auto-scoring with percentile benchmark',
        'Detailed line-by-line answer rationale',
        'Official university matrix calibration',
      ],
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      accentBorder: 'border-blue-500 ring-2 ring-blue-500/20',
      icon: <Clock className="w-5 h-5 text-blue-600" />,
    },
    {
      time: '30 MINUTES',
      tag: 'Targeted Skill Drill',
      title: 'Topic Practice Questions',
      description:
        'High-density question sets targeting specific chapters (e.g. Polymorphism or Collections) with instant feedback.',
      idealFor: 'Between classes & study sessions',
      features: [
        'Choose specific subject modules',
        'Immediate explanation on every question',
        'No exam timer stress',
        'Bookmark difficult questions for later',
      ],
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      btnColor: 'bg-cyan-600 hover:bg-cyan-700 text-white',
      accentBorder: 'border-cyan-500 ring-2 ring-cyan-500/20',
      icon: <Target className="w-5 h-5 text-cyan-600" />,
    },
    {
      time: '10 MINUTES',
      tag: 'Last-Minute Recall',
      title: 'CheatSheet + Flashcards',
      description:
        'Condensed 1-page memory sheet and high-frequency flashcard flips. Perfect for refreshing memory right outside the exam room.',
      idealFor: '15 mins before exam hall opens',
      features: [
        '1-Page high-yield formula cheat sheet',
        'Top 25 exam traps & syntax gotchas',
        'Mobile-optimized swipeable flashcards',
        'Downloadable printable PDF',
      ],
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      accentBorder: 'border-indigo-500 ring-2 ring-indigo-500/20',
      icon: <Zap className="w-5 h-5 text-indigo-600" />,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <Clock size={13} className="text-blue-600" />
            <span>Time-Optimized Learning</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            You don't always have a week to study.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Whether you have an entire weekend or only 10 minutes standing outside the exam hall,
            TQMaster adapts to your exact timeline.
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {timeOptions.map((card, idx) => {
            const isSelected = activeCard === idx;
            return (
              <div
                key={card.time}
                onClick={() => setActiveCard(idx)}
                className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                  isSelected
                    ? `${card.accentBorder} shadow-lg`
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  {/* Top Time Pill & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black tracking-wider border ${card.badgeBg}`}
                    >
                      {card.time}
                    </span>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      {card.icon}
                    </div>
                  </div>

                  {/* Title & Tag */}
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {card.tag}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    {card.description}
                  </p>

                  {/* Ideal Timing Pill */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-semibold mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Best for: {card.idealFor}</span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-8">
                    {card.features.map((feat, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-center gap-2 text-xs text-slate-600"
                      >
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/auth');
                  }}
                  className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${card.btnColor} shadow-sm`}
                >
                  <span>Start {card.time} Session</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Final Message */}
        <div className="text-center mt-12">
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            However much time you have, make it count.
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Zero time wasted on setup or formatting. Open and start studying in seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
