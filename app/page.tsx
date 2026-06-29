"use client";

import Link from "next/link";
import { BookOpen, Presentation, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-stone-50">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl z-10 text-center"
      >
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-4 text-stone-800">
            <BookOpen size={56} strokeWidth={1.5} />
            <h1 className="text-6xl md:text-7xl font-heading font-bold text-stone-800 tracking-tight">MathPace</h1>
          </div>
          <p className="text-stone-500 font-sans text-xl italic max-w-2xl mx-auto">
            Your personal, AI-powered study companion. Choose a mode to begin learning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
          {/* Walkthrough Mode */}
          <Link href="/walkthrough" className="group block">
            <div className="h-full bg-white border border-stone-200/60 shadow-lg rounded-2xl p-8 hover:shadow-xl hover:border-stone-300 transition-all text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Presentation size={100} />
              </div>
              <div className="bg-blue-50 text-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Presentation size={28} />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-3 font-heading">Walkthrough Mode</h2>
              <p className="text-stone-500 text-base leading-relaxed">
                Upload your notes and let the AI build a step-by-step presentation, guiding you logically through the material just like a teacher would.
              </p>
            </div>
          </Link>

          {/* Interactive Reader Mode */}
          <Link href="/reader" className="group block">
            <div className="h-full bg-white border border-stone-200/60 shadow-lg rounded-2xl p-8 hover:shadow-xl hover:border-stone-300 transition-all text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles size={100} />
              </div>
              <div className="bg-emerald-50 text-emerald-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-3 font-heading">Interactive Reader</h2>
              <p className="text-stone-500 text-base leading-relaxed">
                A progressive web app notebook gallery. Open your PDFs or images locally, use the pen tool to highlight any part, and get instant contextual answers.
              </p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
