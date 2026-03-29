"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User, Character } from "@/lib/types";
import { useAudio } from "@/hooks/useAudio";

const FLAVOR_TEXTS = [
  "正在翻阅命运之书...",
  "挑选武器和防具中...",
  "调配属性点数...",
  "赋予角色灵魂...",
  "编织技能咒语...",
  "锻造传说装备...",
  "测试战斗姿态...",
  "刻画角色外貌...",
  "注入关键词之力...",
  "即将完成...",
];

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [keywords, setKeywords] = useState(["", "", ""]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [flavorIdx, setFlavorIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playBgm, playSfx } = useAudio();

  // BGM：锻造页神秘氛围
  useEffect(() => { playBgm("forge"); }, [playBgm]);

  // 生成中的轮播文案 + 计时
  useEffect(() => {
    if (generating) {
      setFlavorIdx(0);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
        setFlavorIdx((i) => (i + 1) % FLAVOR_TEXTS.length);
      }, 2500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [generating]);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));

    const charData = sessionStorage.getItem("character");
    if (charData) {
      setCharacter(JSON.parse(charData));
    }
  }, [router]);

  const handleGenerate = async () => {
    if (!user) return;
    setError("");

    // 校验：必须填满 3 个关键词
    const filledKeywords = keywords.filter(k => k.trim());
    if (filledKeywords.length < 3) {
      setError("请填满 3 个关键词");
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch("/api/character/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, keywords: filledKeywords.join(" ") }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }

      setCharacter(data.character);
      sessionStorage.setItem("character", JSON.stringify(data.character));
    } catch {
      setError("网络错误，请重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !character) return;

    try {
      const res = await fetch("/api/character/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, characterId: character.id }),
      });

      if (res.ok) {
        setCharacter(null);
        setKeywords(["", "", ""]);
        sessionStorage.removeItem("character");
        setShowDeleteConfirm(false);
        setError("");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "删除失败");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("删除失败");
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("character");
    router.push("/");
  };

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col p-4 relative">
      <div className="scanline-overlay" />

      <div className="z-10 w-full max-w-lg mx-auto">
        {/* 顶栏 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="font-pixel text-pixel-green text-xs">
              {user.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="font-pixel-zh text-gray-500 text-sm hover:text-gray-300"
          >
            退出
          </button>
        </div>

        {/* 无角色：生成角色 */}
        {!character && (
          <div className="pixel-card">
            <h2 className="font-pixel-zh text-pixel-yellow text-lg mb-4">
              🎲 创建角色
            </h2>
            <p className="font-pixel-zh text-gray-400 text-sm mb-2">
              输入 3 个关键词，锻造你的专属角色。
            </p>
            <p className="font-pixel-zh text-gray-500 text-xs mb-5">
              每个关键词最多5个字 · 三个都要填哦
            </p>

            {/* 三个关键词宫格 */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="text-center">
                  <label className="font-pixel text-gray-500 text-xs block mb-2">
                    {["① ", "② ", "③ "][i]}
                  </label>
                  <input
                    type="text"
                    value={keywords[i]}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                      setIsComposing(false);
                      const newKw = [...keywords];
                      newKw[i] = (e.target as HTMLInputElement).value.slice(0, 5);
                      setKeywords(newKw);
                    }}
                    onChange={(e) => {
                      if (isComposing) {
                        const newKw = [...keywords];
                        newKw[i] = e.target.value;
                        setKeywords(newKw);
                        return;
                      }
                      const newKw = [...keywords];
                      newKw[i] = e.target.value.slice(0, 5);
                      setKeywords(newKw);
                    }}
                    placeholder={["火焰", "战士", "龙"][i]}
                    className="pixel-input w-full text-center text-base"
                    disabled={generating}
                    maxLength={5}
                  />
                </div>
              ))}
            </div>

            {error && (
              <p className="font-pixel-zh text-pixel-red text-sm mb-4">
                ⚠ {error}
              </p>
            )}

            <button
              onClick={() => { playSfx("click"); handleGenerate(); }}
              disabled={generating}
              className="pixel-btn-primary w-full text-base disabled:opacity-50"
            >
              {generating ? "🔮 角色锻造中..." : "⚡ 创建"}
            </button>

            {generating && (
              <div className="text-center mt-3 space-y-1">
                <p className="font-pixel-zh text-pixel-yellow text-xs animate-pulse">
                  {FLAVOR_TEXTS[flavorIdx]}
                </p>
                <p className="font-pixel text-gray-600 text-xs">
                  {elapsed}s
                </p>
              </div>
            )}
          </div>
        )}

        {/* 有角色：角色详情 */}
        {character && (
          <>
            {/* 角色身份卡：名字 + 关键词 + 描述 + HP */}
            <div className="pixel-card mb-4">
              <div className="flex justify-between items-start mb-1">
                <h2 className="font-pixel-zh text-pixel-yellow text-xl truncate flex-1">
                  {character.name}
                </h2>
                <span className="font-pixel text-pixel-red text-xs shrink-0 ml-2">
                  HP {character.max_hp}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-pixel text-gray-600 text-xs shrink-0">Keywords:</span>
                <span className="font-pixel-zh text-gray-400 text-sm">{character.keywords}</span>
              </div>
              <p className="font-pixel-zh text-gray-400 text-xs leading-relaxed">
                {character.description}
              </p>
              {/* 六维属性 — 紧凑单行 */}
              <div className="grid grid-cols-6 gap-1 mt-3 pt-3 border-t border-gray-700">
                {[
                  { abbr: "STR", value: character.str },
                  { abbr: "DEX", value: character.dex },
                  { abbr: "CON", value: character.con },
                  { abbr: "INT", value: character.int_val },
                  { abbr: "WIS", value: character.wis },
                  { abbr: "CHA", value: character.cha },
                ].map((s) => (
                  <div key={s.abbr} className="text-center">
                    <p className="font-pixel text-gray-600 text-xs">{s.abbr}</p>
                    <p className={`font-pixel text-xs ${s.value >= 16 ? "text-pixel-green" : s.value >= 12 ? "text-pixel-yellow" : s.value >= 8 ? "text-pixel-orange" : "text-pixel-red"}`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 核心操作区 — 始终在第一屏 */}
            {error && (
              <p className="font-pixel-zh text-pixel-red text-sm mb-3">
                ⚠ {error}
              </p>
            )}
            <button
              onClick={() => { playSfx("click"); router.push("/battle"); }}
              className="pixel-btn-primary w-full text-lg mb-3 py-4"
            >
              ⚔️ 开始对战
            </button>

            <div className="flex gap-3 mb-6">
              <Link
                href="/rankings"
                className="pixel-btn-secondary flex-1 text-sm text-center"
              >
                🏆 排行榜
              </Link>
              <Link
                href="/history"
                className="pixel-btn-secondary flex-1 text-sm text-center"
              >
                📜 历史记录
              </Link>
            </div>

            {/* 装备与技能详情 — 可折叠区域 */}
            <details className="mb-4 group" open>
              <summary className="pixel-card cursor-pointer flex items-center justify-between list-none">
                <span className="font-pixel-zh text-pixel-green text-sm">📋 角色详情</span>
                <span className="font-pixel text-gray-600 text-xs group-open:rotate-90 transition-transform">▶</span>
              </summary>

              <div className="mt-2 space-y-3">
                {/* 武器 */}
                {character.weapons?.length > 0 && (
                  <div className="pixel-card">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">⚔️ 武器</h3>
                    {character.weapons.map((w, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <div className="flex justify-between">
                          <span className="font-pixel-zh text-pixel-yellow text-sm">{w.name}</span>
                          <span className="font-pixel text-pixel-red text-xs">ATK {w.attack}</span>
                        </div>
                        <p className="font-pixel-zh text-gray-500 text-xs">{w.type} · {w.effect}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 防具 */}
                {character.armors?.length > 0 && (
                  <div className="pixel-card">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">🛡️ 防具</h3>
                    {character.armors.map((a, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <div className="flex justify-between">
                          <span className="font-pixel-zh text-pixel-yellow text-sm">{a.name}</span>
                          <span className="font-pixel text-pixel-blue text-xs">DEF {a.defense}</span>
                        </div>
                        <p className="font-pixel-zh text-gray-500 text-xs">{a.type} · {a.effect}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 技能 */}
                {character.skills?.length > 0 && (
                  <div className="pixel-card">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">✨ 技能</h3>
                    {character.skills.map((s, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <div className="flex justify-between">
                          <span className="font-pixel-zh text-pixel-purple text-sm">{s.name}</span>
                          <span className="font-pixel text-pixel-orange text-xs">DMG {s.damage} · CD {s.cooldown}</span>
                        </div>
                        <p className="font-pixel-zh text-gray-500 text-xs">[{s.source}] {s.effect}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 特殊物品 */}
                {character.items?.length > 0 && (
                  <div className="pixel-card">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">🎒 特殊物品</h3>
                    {character.items.map((item, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <span className="font-pixel-zh text-pixel-yellow text-sm">{item.name}</span>
                        <p className="font-pixel-zh text-gray-500 text-xs">{item.description}</p>
                        <p className="font-pixel-zh text-gray-600 text-xs">
                          效果：{item.effect} {item.power > 0 && `(力量 +${item.power})`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>

            {/* 危险操作 — 放最底部，远离主操作 */}
            <div className="text-center mb-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="font-pixel-zh text-gray-600 text-xs underline hover:text-red-400 transition-colors"
              >
                删除角色
              </button>
            </div>

            {/* 删除确认弹窗 */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="pixel-card max-w-sm w-full">
                  <h3 className="font-pixel-zh text-pixel-red text-lg mb-3">
                    ⚠️ 确认删除
                  </h3>
                  <p className="font-pixel-zh text-gray-300 text-sm mb-4">
                    确定要删除角色「{character.name}」吗？此操作不可撤回。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="pixel-btn-secondary flex-1"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDelete}
                      className="pixel-btn-danger flex-1"
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

