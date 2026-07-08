"use client";

import Link from "next/link";
import { Presentation, Sparkles } from "@/components/icons";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* Humorous Banner */}
      <div className="sticky top-0 left-0 w-full bg-orange-100 text-orange-800 border-b border-orange-200 text-center py-2 px-4 text-sm font-medium z-50 flex items-center justify-center gap-2">
        <span>🚧</span> Pardon the visuals on this version! Massive UI improvements are coming soon, but we hope this helps in the meantime! <span>🚀</span>
      </div>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full p-6 max-w-4xl z-10 text-center"
      >
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrandLogo size="lg" />
            <h1 className="text-6xl md:text-7xl font-heading font-bold tracking-tight">Catchup</h1>
          </div>
          <p className="text-stone-500 dark:text-stone-400 font-sans text-xl italic max-w-2xl mx-auto">
            Your personal, AI-powered study companion. Choose a mode to begin learning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
          {/* Walkthrough Mode */}
          <Link href="/walkthrough" className="group block">
            <div className="h-full bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 shadow-lg rounded-2xl p-8 hover:shadow-xl hover:border-stone-300 dark:hover:border-stone-700 transition-all text-left relative overflow-hidden group-hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity text-stone-900 dark:text-stone-100">
                <Presentation size={100} />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Presentation size={28} />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3 font-heading">Walkthrough Mode</h2>
              <p className="text-stone-500 dark:text-stone-400 text-base leading-relaxed">
                Upload your notes and let the AI build a step-by-step presentation, guiding you logically through the material just like a teacher would.
              </p>
            </div>
          </Link>

          {/* Interactive Reader Mode */}
          <Link href="/reader" className="group block">
            <div className="h-full bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 shadow-lg rounded-2xl p-8 hover:shadow-xl hover:border-stone-300 dark:hover:border-stone-700 transition-all text-left relative overflow-hidden group-hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity text-stone-900 dark:text-stone-100">
                <Sparkles size={100} />
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3 font-heading">Interactive Reader</h2>
              <p className="text-stone-500 dark:text-stone-400 text-base leading-relaxed">
                A progressive web app notebook gallery. Open your PDFs or images locally, use the pen tool to highlight any part, and get instant contextual answers.
              </p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-4 text-stone-400 pb-8 z-10 relative w-full">
        <div className="flex flex-col items-center gap-1 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Catchup. All rights reserved.</p>
          <p>
            Made with ❤️ by{" "}
            <a 
              href="https://github.com/DavidTimi1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-orange hover:text-brand-blue transition-colors hover:underline"
            >
              Dev_id
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
