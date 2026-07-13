"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "@/components/icons";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface QnAPanelProps {
  lessonId: string;
  currentMomentId: string;
}

export function QnAPanel({ lessonId, currentMomentId }: QnAPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ text: string; isDeferred: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async (force: boolean = false) => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch(`/api/lessons/${lessonId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, currentMomentId, force }),
      });

      const data = await res.json();
      if (data.success) {
        setAnswer({
          text: data.answer,
          isDeferred: data.isDeferred && !force,
        });
      }
    } catch (err) {
      console.error("Failed to ask question", err);
      setAnswer({ text: "Sorry, I couldn't answer that right now.", isDeferred: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-stone-200 dark:border-stone-800 relative before:absolute before:inset-0 before:bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] dark:before:bg-[radial-gradient(#292524_1px,transparent_1px)] before:bg-[size:12px_12px] before:opacity-20 before:pointer-events-none before:rounded-xl">
      <div className="flex gap-2 relative z-10">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this step..."
          className="bg-white dark:bg-stone-950 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:ring-stone-400 shadow-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") askQuestion(false);
          }}
        />
        <Button
          onClick={() => askQuestion(false)}
          disabled={loading || !question.trim()}
          size="icon"
          className="bg-stone-800 dark:bg-stone-200 hover:bg-stone-900 dark:hover:bg-stone-300 text-white dark:text-stone-900 shrink-0"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </Button>
      </div>

      {answer && (
        <div className="mt-4 p-4 bg-stone-50/90 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-200 relative z-10 shadow-sm">
          <p className="font-sans leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {answer.text}
            </ReactMarkdown>
          </p>

          {answer.isDeferred && (
            <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-2 font-bold">Want the answer right now anyway?</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                onClick={() => askQuestion(true)}
              >
                Force Answer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
