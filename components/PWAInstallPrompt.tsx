"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !deferredPrompt) return null;

  return (
    <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      <div>
        <h3 className="text-emerald-800 dark:text-emerald-300 font-bold">Install MathPace</h3>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">Get the full offline experience directly on your device.</p>
      </div>
      <button 
        onClick={handleInstallClick}
        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-all"
      >
        <div className="flex items-center justify-center gap-2">
          <Download size={18} />
          <span>Install App</span>
        </div>
      </button>
    </div>
  );
}
