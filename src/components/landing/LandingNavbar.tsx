import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Sparkles, Menu, X, LogIn } from 'lucide-react';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      setScrollProgress(total > 0 ? (current / total) * 100 : 0);
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
          : 'bg-white/70 backdrop-blur-sm border-b border-slate-200/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Logo className="w-9 h-9 transition-transform duration-300 group-hover:scale-105" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                TQMaster
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 rounded-full">
                <Sparkles size={10} className="text-blue-500" />
                Smart Curate Learn
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
              University Exam Prep Platform
            </span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => scrollToSection('subjects')}
            className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer"
          >
            Subjects
          </button>
          <button
            onClick={() => scrollToSection('showcase')}
            className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer"
          >
            Platform Preview
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right: ONLY Prominent Login Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 18px rgba(37, 99, 235, 0.35)',
            }}
          >
            <LogIn size={15} />
            <span>Login</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Top Scroll Progress Indicator */}
      <div
        className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 animate-in slide-in-from-top-2">
          <button
            onClick={() => scrollToSection('subjects')}
            className="block w-full text-left py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            Subjects
          </button>
          <button
            onClick={() => scrollToSection('showcase')}
            className="block w-full text-left py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            Platform Preview
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="block w-full text-left py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="block w-full text-left py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            FAQ
          </button>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-2.5 text-center text-sm font-black text-white rounded-xl flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
              }}
            >
              <LogIn size={15} />
              <span>Login</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
