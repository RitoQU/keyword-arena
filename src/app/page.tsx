"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSubtitle(true), 800);
    const t2 = setTimeout(() => setShowButtons(true), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* 扫描线效果 */}
      <div className="scanline-overlay" />

      {/* 标题区域 */}
      <div className="text-center z-10">
        {/* 英文标题 - 像素字体 */}
        <h1 className="font-pixel text-pixel-green text-2xl sm:text-4xl md:text-5xl mb-4 tracking-wider">
          KEYWORD
          <br />
          <span className="text-pixel-yellow">ARENA</span>
        </h1>

        {/* 中文副标题 */}
        <p
          className={`font-pixel-zh text-gray-400 text-lg sm:text-xl mt-6 transition-opacity duration-500 ${
            showSubtitle ? "opacity-100" : "opacity-0"
          }`}
        >
          关 键 词 竞 技 场
        </p>

        {/* 描述 */}
        <p
          className={`font-pixel-zh text-gray-500 text-sm sm:text-base mt-4 max-w-md transition-opacity duration-500 ${
            showSubtitle ? "opacity-100" : "opacity-0"
          }`}
        >
          输入关键词，生成角色，对战！
        </p>

        {/* 操作按钮 */}
        <div
          className={`mt-12 flex flex-col gap-4 items-center transition-opacity duration-500 ${
            showButtons ? "opacity-100" : "opacity-0"
          }`}
        >
          <button className="pixel-btn-primary w-64 text-lg">
            ▶ 开始游戏
          </button>

          <button className="pixel-btn-secondary w-64 text-base">
            📖 游戏说明
          </button>
        </div>

        {/* 闪烁提示 */}
        <p
          className={`font-pixel text-gray-600 text-xs mt-16 pixel-blink transition-opacity duration-500 ${
            showButtons ? "opacity-100" : "opacity-0"
          }`}
        >
          PRESS START
        </p>
      </div>

      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* 左上角装饰 */}
        <div className="absolute top-4 left-4 text-pixel-border font-pixel text-xs opacity-30">
          ╔══════════╗
          <br />
          ║ HP: ???  ║
          <br />
          ║ ATK: ??? ║
          <br />
          ╚══════════╝
        </div>

        {/* 右下角装饰 */}
        <div className="absolute bottom-4 right-4 text-pixel-border font-pixel text-xs opacity-30">
          v0.1.0
        </div>

        {/* 散落的像素点装饰 */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-pixel-green opacity-20" />
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-pixel-yellow opacity-20" />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pixel-red opacity-20" />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-pixel-blue opacity-10" />
      </div>
    </main>
  );
}
