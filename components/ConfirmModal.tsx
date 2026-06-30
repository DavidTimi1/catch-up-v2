"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";
import { useModal } from "@/components/providers/modal-provider";

interface ConfirmModalProps {
  title?: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({ 
  title = "Confirm Action", 
  message, 
  onConfirm, 
  confirmText = "Confirm", 
  cancelText = "Cancel" 
}: ConfirmModalProps) {
  const { hideModal } = useModal();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      hideModal();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col p-2">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <HelpCircle size={24} strokeWidth={2.5} />
        </div>
        <div className="flex-1 mt-1">
          <h2 className="text-xl font-heading font-bold text-stone-900 dark:text-stone-100 mb-1">{title}</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="w-full flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
        <Button
          variant="ghost"
          className="rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 font-medium px-6"
          onClick={hideModal}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] px-8"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
        </Button>
      </div>
    </div>
  );
}
