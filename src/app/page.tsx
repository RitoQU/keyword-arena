"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// 像素粒子类型
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
  direction: number; // 角度
}

// 生成随机粒子
function createParticle(id: number): Particle {
  const colors = ["#00ff41", "#ffd700", "#ff0040", "#00bfff", "#bf00ff", "#ff8c00"];
  return {
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: Math.random() * 0.3 + 0.1,
    opacity: Math.random() * 0.3 + 0.05,
    direction: Math.random() * 360,
  };
}

export default function Home() {
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // 初始化粒子
  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => createParticle(i)));
  }, []);

  // 粒子动画循环
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => {
          const rad = (p.direction * Math.PI) / 180;
          let nx = p.x + Math.cos(rad) * p.speed;
          let ny = p.y + Math.sin(rad) * p.speed;
          let nd = p.direction;
          // 边界反弹
          if (nx < -2 || nx > 102) { nd = 180 - nd; nx = Math.max(0, Math.min(100, nx)); }
          if (ny < -2 || ny > 102) { nd = -nd; ny = Math.max(0, Math.min(100, ny)); }
          return { ...p, x: nx, y: ny, direction: nd };
        })
      );
    }, 80);
    return () => clearInterval(interval);
  }, []);

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

      {/* 像素粒子背景 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute transition-all duration-100"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size * 3}px`,
              height: `${p.size * 3}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

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
          <Link
            href="/login"
            className="pixel-btn-primary w-64 text-lg block text-center"
          >
            ▶ 开始游戏
          </Link>

          <button
            onClick={() => setShowRules(true)}
            className="pixel-btn-secondary w-64 text-base"
          >
            📖 游戏说明
          </button>
        </div>
      </div>

      {/* 游戏说明弹窗 (OPT-01) */}
      {showRules && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="pixel-card max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="font-pixel text-pixel-yellow text-sm mb-4 text-center">
              📖 HOW TO PLAY
            </h2>

            <div className="space-y-4 font-pixel-zh text-gray-300 text-sm leading-relaxed">
              <div>
                <h3 className="text-pixel-green mb-1">🎲 创建角色</h3>
                <p>输入 1-3 个关键词（用空格分隔），AI 会为你生成一个独一无二的游戏角色，拥有 D&D 风格的六维属性、武器、防具、技能和特殊物品。</p>
              </div>

              <div>
                <h3 className="text-pixel-green mb-1">⚔️ 回合制对战</h3>
                <p>系统自动匹配对手，两个角色进行最多 10 回合的自动战斗。角色会使用普通攻击和技能轮番进攻，特殊物品有概率触发。</p>
              </div>

              <div>
                <h3 className="text-pixel-green mb-1">🏆 胜负判定</h3>
                <p>先将对方 HP 降为 0 的一方获胜。若 10 回合后双方都存活，则 HP 百分比高的一方胜出。</p>
              </div>

              <div>
                <h3 className="text-pixel-green mb-1">💡 小贴士</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>关键词越有想象力，角色越有趣</li>
                  <li>每天可以生成 3 个角色、对战 20 场</li>
                  <li>不满意当前角色？删除后重新生成</li>
                  <li>不同关键词会生成不同风格的角色</li>
                </ul>
              </div>

              <div>
                <h3 className="text-pixel-green mb-1">🔑 账号说明</h3>
                <p>你的「名字」+「识别码」就是你的游戏账号。下次登录时输入一样的名字和识别码，就能找回你的角色和战绩。请记住它们，并且不要告诉别人——识别码相当于你的密码。</p>
              </div>

              <div className="border-t border-gray-700 pt-3 mt-3">
                <h3 className="text-pixel-yellow mb-1">✨ Special Thanks</h3>
                <p className="text-gray-400">Brickea — for the inspiration and support.</p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="pixel-btn-primary w-full mt-6"
            >
              知道了！
            </button>
          </div>
        </div>
      )}

      {/* 底部信息 (OPT-12) */}
      <div className="absolute bottom-3 z-10 text-center opacity-40">
        <p className="font-pixel text-gray-500" style={{ fontSize: '0.5rem' }}>
          EARLY ACCESS v0.2.0
        </p>
        <p className="font-pixel-zh text-gray-500 mt-0.5" style={{ fontSize: '0.6rem' }}>
          Designed by Rito × Copilot
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
      </div>
    </main>
  );
}
