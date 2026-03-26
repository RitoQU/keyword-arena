"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RankingEntry {
  userId: string;
  userName: string;
  characterName: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}

export default function RankingsPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

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

  const medalEmoji = (rank: number) => {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return `${rank + 1}`;
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
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
                className={`grid grid-cols-12 gap-2 px-3 py-3 pixel-card ${
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
                  <p className="font-pixel-zh text-pixel-yellow text-xs truncate">
                    {r.characterName}
                  </p>
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
    </div>
  );
}
