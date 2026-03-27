"use client";

import { useAudio } from "@/hooks/useAudio";

/** 全局静音/取消静音按钮 — 固定在右上角 */
export function AudioToggle() {
  const { muted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      className="fixed top-3 right-3 z-50 w-10 h-10 flex items-center justify-center
                 bg-gray-900/80 border border-gray-700 rounded-lg
                 hover:bg-gray-800 hover:border-gray-500 transition-colors
                 text-lg select-none"
      title={muted ? "开启音效" : "静音"}
      aria-label={muted ? "开启音效" : "静音"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
