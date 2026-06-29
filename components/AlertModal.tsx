"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useModal } from "@/components/providers/modal-provider";

interface AlertModalProps {
  title?: string;
  message: string;
}

export function AlertModal({ title = "Attention", message }: AlertModalProps) {
  const { hideModal } = useModal();

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 mt-2">
        <AlertCircle size={24} />
      </div>

      <h2 className="text-xl font-heading font-bold text-stone-800 dark:text-stone-100 mb-2">{title}</h2>
      <p className="text-stone-500 dark:text-stone-400 mb-6">{message}</p>

      <Button
        className="w-full bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-stone-300 dark:text-stone-900 text-white font-bold rounded-xl transition-all"
        onClick={hideModal}
      >
        Okay
      </Button>
    </div>
  );
}
