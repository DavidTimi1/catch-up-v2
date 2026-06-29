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
    <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mt-2">
        <HelpCircle size={24} />
      </div>

      <h2 className="text-xl font-heading font-bold text-stone-800 mb-2">{title}</h2>
      <p className="text-stone-500 mb-6">{message}</p>

      <div className="w-full flex gap-3">
        <Button
          variant="outline"
          className="flex-1 rounded-xl border-stone-200 text-stone-600"
          onClick={hideModal}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
        </Button>
      </div>
    </div>
  );
}
