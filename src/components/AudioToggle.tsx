"use client";

import { useAudio } from "@/hooks/useAudio";

/** 像素风格喇叭图标 — 未静音 */
function SpeakerOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
         style={{ imageRendering: "pixelated" }}>
      {/* 喇叭主体 */}
      <rect x="2" y="5" width="2" height="6" fill="currentColor" />
      <rect x="4" y="4" width="1" height="8" fill="currentColor" />
      <rect x="5" y="3" width="1" height="10" fill="currentColor" />
      <rect x="6" y="2" width="1" height="12" fill="currentColor" />
      {/* 音波 */}
      <rect x="9" y="5" width="1" height="1" fill="currentColor" />
      <rect x="9" y="10" width="1" height="1" fill="currentColor" />
      <rect x="11" y="3" width="1" height="1" fill="currentColor" />
      <rect x="11" y="7" width="1" height="2" fill="currentColor" />
      <rect x="11" y="12" width="1" height="1" fill="currentColor" />
      <rect x="13" y="2" width="1" height="1" fill="currentColor" />
      <rect x="13" y="6" width="1" height="1" fill="currentColor" />
      <rect x="13" y="9" width="1" height="1" fill="currentColor" />
      <rect x="13" y="13" width="1" height="1" fill="currentColor" />
    </svg>
  );
}

/** 像素风格喇叭图标 — 静音（带 X） */
function SpeakerOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
         style={{ imageRendering: "pixelated" }}>
      {/* 喇叭主体 */}
      <rect x="2" y="5" width="2" height="6" fill="currentColor" />
      <rect x="4" y="4" width="1" height="8" fill="currentColor" />
      <rect x="5" y="3" width="1" height="10" fill="currentColor" />
      <rect x="6" y="2" width="1" height="12" fill="currentColor" />
      {/* X 标记 */}
      <rect x="9" y="5" width="1" height="1" fill="currentColor" />
      <rect x="10" y="6" width="1" height="1" fill="currentColor" />
      <rect x="11" y="7" width="1" height="1" fill="currentColor" />
      <rect x="12" y="8" width="1" height="1" fill="currentColor" />
      <rect x="13" y="9" width="1" height="1" fill="currentColor" />
      <rect x="13" y="5" width="1" height="1" fill="currentColor" />
      <rect x="12" y="6" width="1" height="1" fill="currentColor" />
      <rect x="10" y="8" width="1" height="1" fill="currentColor" />
      <rect x="9" y="9" width="1" height="1" fill="currentColor" />
    </svg>
  );
}

/** 全局静音/取消静音按钮 — 固定在右上角，像素风格 */
export function AudioToggle() {
  const { muted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      className="fixed top-3 right-3 z-50 w-10 h-10 flex items-center justify-center
                 bg-gray-900/80 border-2 border-gray-600 
                 hover:bg-gray-800 hover:border-gray-400 transition-colors
                 text-gray-300 hover:text-white select-none"
      style={{ imageRendering: "pixelated" }}
      title={muted ? "开启音效" : "静音"}
      aria-label={muted ? "开启音效" : "静音"}
    >
      {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
    </button>
  );
}
