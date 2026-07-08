"use client";

import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-50">
      <WifiOff size={16} />
      <span>You are offline. AI features and cloud syncing are disabled. Local notebooks and reader are fully available.</span>
    </div>
  );
}
