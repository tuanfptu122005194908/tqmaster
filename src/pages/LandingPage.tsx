import React, { useEffect } from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import ProductShowcase from '@/components/landing/ProductShowcase';
import SemesterNavigation from '@/components/landing/SemesterNavigation';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import FaqSection from '@/components/landing/FaqSection';
import FinalCtaSection from '@/components/landing/FinalCtaSection';
import LandingFooter from '@/components/landing/LandingFooter';
import { motion } from 'framer-motion';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'TQMaster — Nền Tảng Ôn Thi Đại Học Toàn Diện | Smart Curate Learn';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleExploreSubjects = () => {
    const el = document.getElementById('subjects');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      {/* 01. Minimal Sticky Navbar with top progress bar */}
      <LandingNavbar />

      <main className="flex-1 overflow-hidden">
        {/* 02. Hero Section with 3D Knowledge Core */}
        <LandingHero onExploreSubjects={handleExploreSubjects} />

        {/* 03. Unified Product Preview with Live Interactive Mock Exam */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProductShowcase />
        </motion.div>

        {/* 04. Semester Navigation (Kỳ 1 to Kỳ 9 Timeline) */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <SemesterNavigation />
        </motion.div>

        {/* 05. Core Capabilities (4 High-Impact Pillars) */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <FeaturesGrid />
        </motion.div>

        {/* 06. Essential FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <FaqSection />
        </motion.div>

        {/* 07. Clean Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <FinalCtaSection onExploreSubjects={handleExploreSubjects} />
        </motion.div>
      </main>

      {/* 08. Minimal White Footer */}
      <LandingFooter />
    </div>
  );
}
