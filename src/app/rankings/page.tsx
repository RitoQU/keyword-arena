"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/types";

interface RankingEntry {
  userId: string;
  userName: string;
  characterId: string | null;
  characterName: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}

interface CharacterDetail extends Character {
  ownerName: string;
}

export default function RankingsPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<CharacterDetail | null>(null);
  const [charLoading, setCharLoading] = useState(false);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setMyUserId(JSON.parse(userData).id);
    }
    fetchRankings();
  }, []);

  async function fetchRankings() {
    try {
      const resp = await fetch("/api/rankings");
      const data = await resp.json();
      setRankings(data.rankings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function openCharDetail(characterId: string) {
    setCharLoading(true);
    setSelectedChar(null);
    try {
      const resp = await fetch(`/api/character/${encodeURIComponent(characterId)}`);
      if (resp.ok) {
        const data = await resp.json();
        setSelectedChar(data.character);
      }
    } catch {
      // ignore
    } finally {
      setCharLoading(false);
    }
  }

  const medalEmoji = (rank: number) => {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return `${rank + 1}`;
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <button onClick={() => router.push("/game")} className="font-pixel-zh text-gray-500 text-sm hover:text-gray-300 transition-colors">
          ← 返回
        </button>
      </div>
      <div className="text-center mb-6">
        <h1 className="font-pixel text-pixel-yellow text-lg">🏆 RANKINGS 🏆</h1>
        <p className="font-pixel-zh text-gray-500 text-sm mt-2">玩家累计战绩排行</p>
      </div>

      {loading ? (
        <div className="text-center">
          <p className="font-pixel text-pixel-green pixel-blink">LOADING...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="pixel-card text-center">
          <p className="font-pixel-zh text-gray-400">暂无对战记录</p>
          <p className="font-pixel-zh text-gray-600 text-sm mt-2">快去对战创造历史吧！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs">
            <span className="col-span-1 font-pixel text-gray-500">#</span>
            <span className="col-span-3 font-pixel-zh text-gray-500">玩家</span>
            <span className="col-span-2 font-pixel text-gray-500 text-right">W/L</span>
            <span className="col-span-2 font-pixel text-gray-500 text-right">WIN%</span>
            <span className="col-span-4 font-pixel-zh text-gray-500 text-right">当前角色</span>
          </div>

          {rankings.map((r, idx) => {
            const isMe = r.userId === myUserId;
            return (
              <div
                key={r.userId}
                className={`grid grid-cols-12 gap-2 px-3 py-3 items-center pixel-card ${
                  isMe ? "border-pixel-green" : ""
                }`}
                style={isMe ? { borderColor: "#00ff41" } : undefined}
              >
                <span className="col-span-1 font-pixel text-sm flex items-center">
                  {medalEmoji(idx)}
                </span>
                <div className="col-span-3">
                  <p className={`font-pixel text-xs truncate ${isMe ? "text-pixel-green" : "text-white"}`}>
                    {r.userName}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <span className="font-pixel text-xs">
                    <span className="text-green-400">{r.wins}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-red-400">{r.losses}</span>
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className="font-pixel text-xs"
                    style={{
                      color: r.winRate >= 60 ? "#00ff41" : r.winRate >= 40 ? "#ffd700" : "#ff4444",
                    }}
                  >
                    {r.winRate}%
                  </span>
                </div>
                <div className="col-span-4 text-right">
                  {r.characterId ? (
                    <button
                      onClick={() => openCharDetail(r.characterId!)}
                      className="font-pixel-zh text-pixel-yellow text-xs truncate max-w-full text-right underline decoration-dotted underline-offset-2 hover:text-yellow-300 transition-colors"
                    >
                      {r.characterName}
                    </button>
                  ) : (
                    <p className="font-pixel-zh text-gray-500 text-xs truncate">
                      {r.characterName}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <button onClick={() => router.push("/game")} className="pixel-btn-secondary w-full">
          ← 返回游戏
        </button>
      </div>

      {/* 角色详情 Modal */}
      {(selectedChar || charLoading) && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
          onClick={() => { setSelectedChar(null); setCharLoading(false); }}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0a0a0a] border-t border-x border-gray-700 p-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {charLoading ? (
              <div className="text-center py-8">
                <p className="font-pixel text-pixel-green pixel-blink">LOADING...</p>
              </div>
            ) : selectedChar && (
              <>
                {/* 关闭按钮 */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedChar(null)}
                    className="font-pixel text-gray-500 text-xs hover:text-white transition-colors"
                  >
                    ✕ CLOSE
                  </button>
                </div>

                {/* 角色名 + HP */}
                <div className="pixel-card mb-3">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="font-pixel-zh text-pixel-yellow text-lg truncate flex-1">
                      {selectedChar.name}
                    </h2>
                    <span className="font-pixel text-pixel-red text-xs shrink-0 ml-2">
                      HP {selectedChar.max_hp}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-pixel text-gray-600 text-xs shrink-0">Keywords:</span>
                    <span className="font-pixel-zh text-gray-400 text-sm">{selectedChar.keywords}</span>
                  </div>
                  <p className="font-pixel-zh text-gray-400 text-xs leading-relaxed mb-3">
                    {selectedChar.description}
                  </p>
                  {/* 六维属性 */}
                  <div className="grid grid-cols-6 gap-1 pt-3 border-t border-gray-700">
                    {[
                      { abbr: "STR", value: selectedChar.str },
                      { abbr: "DEX", value: selectedChar.dex },
                      { abbr: "CON", value: selectedChar.con },
                      { abbr: "INT", value: selectedChar.int_val },
                      { abbr: "WIS", value: selectedChar.wis },
                      { abbr: "CHA", value: selectedChar.cha },
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

                {/* 武器 */}
                {selectedChar.weapons?.length > 0 && (
                  <div className="pixel-card mb-3">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">⚔️ 武器</h3>
                    {selectedChar.weapons.map((w, i) => (
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
                {selectedChar.armors?.length > 0 && (
                  <div className="pixel-card mb-3">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">🛡️ 防具</h3>
                    {selectedChar.armors.map((a, i) => (
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
                {selectedChar.skills?.length > 0 && (
                  <div className="pixel-card mb-3">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">✨ 技能</h3>
                    {selectedChar.skills.map((s, i) => (
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
                {selectedChar.items?.length > 0 && (
                  <div className="pixel-card mb-3">
                    <h3 className="font-pixel-zh text-pixel-green text-sm mb-2">🎒 特殊物品</h3>
                    {selectedChar.items.map((item, i) => (
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

                {/* 创建者 */}
                <p className="font-pixel-zh text-gray-600 text-xs text-center mt-2 mb-2">
                  🎮 {selectedChar.ownerName} · {new Date(selectedChar.created_at).toLocaleDateString("zh-CN")} 创建
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
