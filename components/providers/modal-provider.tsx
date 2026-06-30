"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";

interface ModalContextType {
  showModal: (content: ReactNode, title?: string, description?: string) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalTitle, setModalTitle] = useState<string | undefined>();
  const [modalDescription, setModalDescription] = useState<string | undefined>();

  const showModal = (content: ReactNode, title?: string, description?: string) => {
    setModalContent(content);
    setModalTitle(title);
    setModalDescription(description);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setModalContent(null);
      setModalTitle(undefined);
      setModalDescription(undefined);
    }, 300); // wait for animation
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent showCloseButton={false} className="max-w-4xl bg-[#faf9f6] dark:bg-stone-950 border-zinc-300 dark:border-stone-800 shadow-2xl overflow-hidden p-0 sm:rounded-xl">
          {(modalTitle || modalDescription) && (
            <DialogHeader className="p-4 border-b border-zinc-200 dark:border-stone-800">
              {modalTitle && <DialogTitle className="font-heading text-xl text-stone-900 dark:text-stone-100">{modalTitle}</DialogTitle>}
              {modalDescription && <DialogDescription className="font-sans text-stone-500 dark:text-stone-400">{modalDescription}</DialogDescription>}
            </DialogHeader>
          )}
          {!modalTitle && (
            <DialogTitle className="sr-only">Modal Preview</DialogTitle>
          )}
          <div className="p-4 max-h-[85vh] overflow-auto custom-scrollbar flex justify-center items-center">
            {modalContent}
          </div>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
