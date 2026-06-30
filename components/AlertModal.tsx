"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon } from "lucide-react";
import { useModal } from "@/components/providers/modal-provider";

interface AlertModalProps {
  title?: string;
  message: string;
}

export function AlertModal({ title = "Attention", message }: AlertModalProps) {
  const { hideModal } = useModal();

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center p-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full" />
        <div className="relative w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center shadow-inner">
          <AlertOctagon size={32} strokeWidth={2} />
        </div>
      </div>

      <h2 className="text-2xl font-heading font-black text-stone-900 dark:text-stone-100 mb-3 tracking-tight">{title}</h2>
      <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-8 px-4 font-medium">{message}</p>

      <Button
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-2xl h-14 transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:-translate-y-0.5"
        onClick={hideModal}
      >
        Acknowledge
      </Button>
    </div>
  );
}
