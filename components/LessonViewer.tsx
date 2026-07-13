"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ImageMaskOverlay } from "./ImageMaskOverlay";
import { TTSController } from "./TTSController";
import { QnAPanel } from "./QnAPanel";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Info, Share2, Plus } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "@/components/providers/modal-provider";
import { ExtendLessonModal } from "./ExtendLessonModal";
import { getFileFromCache } from "@/lib/localCache";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function LessonViewer({ lessonId }: { lessonId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lesson, setLesson] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [displayUrl, setDisplayUrl] = useState<string>("");
  const { showModal } = useModal();

  const fetchLesson = useCallback(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLesson(data.lesson);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleNext = useCallback(() => {
    if (!lesson) return;
    setCurrentIndex((prev) => {
      if (prev < lesson.moments.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [lesson]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Lesson link copied to clipboard!");
  };


  const currentMoment = lesson ? (lesson?.moments[currentIndex] || lesson?.moments[lesson?.moments.length - 1]) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentImage = lesson?.images?.find((img: any) => img.id === currentMoment?.imageId) || lesson?.images[0];


  useEffect(() => {
    if (!currentImage) return;
    let active = true;

    const loadCache = async () => {
      try {
        const file = await getFileFromCache(currentImage.publicId);
        if (file && active) {
          setDisplayUrl(URL.createObjectURL(file));
        } else if (active) {
          setDisplayUrl(currentImage.url);
        }
      } catch {
        if (active) setDisplayUrl(currentImage.url);
      }
    };

    loadCache();

    return () => {
      active = false;
    };
  }, [currentImage]);


  const handleExtend = () => {
    showModal(
      <ExtendLessonModal
        lessonId={lessonId}
        onSuccess={() => {
          fetchLesson();
          // Optionally auto-advance to the newly added stuff:
          setCurrentIndex(lesson.moments.length);
        }}
      />,
      "Extend Lesson"
    );
  };

  if (loading && !lesson) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-transparent text-stone-800 dark:text-stone-200">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!lesson || !lesson.moments || lesson.moments.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-transparent text-stone-800 dark:text-stone-200">
        <p className="font-heading text-2xl font-bold">Lesson not found or has no content.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans bg-transparent">

      {/* Top Header */}
      <header className="flex-none h-16 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md px-4 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-stone-800 dark:text-stone-100 truncate max-w-[200px] md:max-w-md">
            {lesson.title}
          </h1>
          <span className="hidden md:inline-block px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs font-bold text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
            Step {currentIndex + 1} of {lesson.moments.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleShare} className="hidden md:flex gap-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300">
            <Share2 size={16} /> Share
          </Button>
          <Button size="sm" onClick={handleExtend} className="gap-2 bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-stone-300 dark:text-stone-900 text-white rounded-md">
            <Plus size={16} /> Extend
          </Button>
        </div>
      </header>

      {/* Main Content: Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">

        {/* Left: Image Area */}
        <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 bg-stone-50/30 dark:bg-black/20 overflow-hidden">
          {/* Tap zones for mobile navigation */}
          <div className="absolute left-0 top-0 w-1/6 h-full z-20 cursor-pointer md:hidden" onClick={handlePrev} />
          <div className="absolute right-0 top-0 w-1/6 h-full z-20 cursor-pointer md:hidden" onClick={handleNext} />

          <ImageMaskOverlay
            imageUrl={displayUrl || currentImage.url}
            polygons={typeof currentMoment.polygons === "string" ? JSON.parse(currentMoment.polygons) : currentMoment.polygons}
            highlightLines={currentMoment.highlightLines ? (typeof currentMoment.highlightLines === "string" ? JSON.parse(currentMoment.highlightLines) : currentMoment.highlightLines) : undefined}
          />
        </div>

        {/* Right: Sidebar Area */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex-none border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-950/90 backdrop-blur-sm flex flex-col h-[40vh] md:h-full z-30">

          {/* Sidebar Header (Persistent TTS Control) */}
          <div className="flex-none p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-950/50">
            <span className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Audio Guide</span>
            <TTSController
              textToSpeak={currentMoment.explanation}
              onEnd={handleNext}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">

            <AnimatePresence mode="wait">
              <motion.div
                key={currentMoment.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {/* Caption Box */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm relative before:absolute before:inset-0 before:bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] dark:before:bg-[radial-gradient(#292524_1px,transparent_1px)] before:bg-[size:12px_12px] before:opacity-30 before:pointer-events-none before:rounded-xl">

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Walkthrough</span>
                  </div>

                  <p className="text-lg text-stone-800 dark:text-stone-200 leading-relaxed relative z-10 font-sans">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentMoment.explanation}
                    </ReactMarkdown>
                  </p>
                </div>

                {/* Extra Context Box */}
                {currentMoment.extraTitle && (
                  <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg flex gap-3 items-start relative z-10">
                    <Info className="text-blue-500 mt-1 shrink-0" size={18} />
                    <div>
                      <h4 className="text-stone-800 dark:text-stone-200 font-bold font-heading text-lg mb-1">{currentMoment.extraTitle}</h4>
                      <p className="text-stone-600 dark:text-stone-400 text-sm">{currentMoment.extraBody}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-auto">
              <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-3 uppercase tracking-wider">Ask a Question</h3>
              <QnAPanel lessonId={lesson.id} currentMomentId={currentMoment.id} />
            </div>

          </div>

          {/* Sidebar Footer Controls */}
          <div className="flex-none p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="gap-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300"
            >
              <ChevronLeft size={18} /> Prev
            </Button>
            <span className="text-sm font-bold text-stone-500 dark:text-stone-400 md:hidden">
              {currentIndex + 1} / {lesson.moments.length}
            </span>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === lesson.moments.length - 1}
              className="gap-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300"
            >
              Next <ChevronRight size={18} />
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
