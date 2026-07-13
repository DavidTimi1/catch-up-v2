"use client";

import { X, ExternalLink } from "@/components/icons";
import { Interaction } from "@/lib/db/localReaderDb";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/modal-provider";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface InteractionPreviewModalProps {
  interaction: Interaction & { pageOrder: number };
  onJumpToPage: (pageOrder: number) => void;
}

export function InteractionPreviewModal({ interaction, onJumpToPage }: InteractionPreviewModalProps) {
  const { hideModal } = useModal();

  const handleJump = () => {
    hideModal();
    onJumpToPage(interaction.pageOrder);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[80vh] max-h-[800px] overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
        <h2 className="text-xl font-heading font-bold text-stone-800 dark:text-stone-100">
          Interaction Details
        </h2>
        <button onClick={hideModal} className="text-stone-400 hover:text-stone-600 transition-colors p-2">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-500 mb-2 uppercase tracking-wide">You Asked</h3>
          <p className="text-stone-800 dark:text-stone-200 font-medium">&quot;{interaction.prompt}&quot;</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-emerald-600 mb-3 uppercase tracking-wide">AI Explanation</h3>
          <div className="prose prose-stone dark:prose-invert max-w-none text-stone-700 dark:text-stone-300">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {interaction.readableAnswer}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 shrink-0 flex justify-end gap-3">
        <Button variant="outline" onClick={hideModal}>
          Close
        </Button>
        <Button 
          onClick={handleJump} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
        >
          <span>Jump to Page {interaction.pageOrder + 1}</span>
          <ExternalLink size={16} />
        </Button>
      </div>
    </div>
  );
}
