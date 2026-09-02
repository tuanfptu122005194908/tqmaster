import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function LandingFooter() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-black text-slate-900 tracking-tight">
                TQMaster
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                Smart Curate Learn
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              The premier university exam preparation platform for Software Engineering and
              Information Technology students.
            </p>
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All systems operational • Spring 2026 Ready</span>
            </div>
          </div>

          {/* Col 1: Learning */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Study Packs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollTo('subjects')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Subjects
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('mock-exam')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Mock Exams
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('showcase')}
                  className="hover:text-blue-600 transition-colors"
                >
                  PE Practice
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('showcase')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Theory CheatSheets
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="hover:text-blue-600 transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('faq')}
                  className="hover:text-blue-600 transition-colors"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Account
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('/auth')}
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/auth')}
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  Register
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div>
            © {new Date().getFullYear()} TQMaster (Smart Curate Learn). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-pointer">University Academic Integrity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
