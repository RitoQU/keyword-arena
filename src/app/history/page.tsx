"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BattleRecord {
  id: string;
  playerName: string;
  playerKeywords: string;
  opponentName: string;
  opponentKeywords: string;
  winner: "player" | "opponent" | "draw";
  totalRounds: number;
  summary: string;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<BattleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userData);
    fetchHistory(user.id);
  }, [router]);

  async function fetchHistory(userId: string) {
    try {
      const resp = await fetch(`/api/battles/history?userId=${encodeURIComponent(userId)}`);
      const data = await resp.json();
      setHistory(data.history || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hour}:${min}`;
  }

  const resultLabel = (w: string) => {
    if (w === "player") return { text: "胜", color: "#00ff41", emoji: "🏆" };
    if (w === "opponent") return { text: "负", color: "#ff4444", emoji: "💀" };
    return { text: "平", color: "#ffd700", emoji: "🤝" };
  };

  // 统计
  const wins = history.filter((h) => h.winner === "player").length;
  const losses = history.filter((h) => h.winner === "opponent").length;
  const draws = history.filter((h) => h.winner === "draw").length;

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <button onClick={() => router.push("/game")} className="font-pixel-zh text-gray-500 text-sm hover:text-gray-300 transition-colors">
          ← 返回
        </button>
      </div>
      <div className="text-center mb-6">
        <h1 className="font-pixel text-pixel-yellow text-lg">📜 HISTORY 📜</h1>
        <p className="font-pixel-zh text-gray-500 text-sm mt-2">对战记录</p>
      </div>

      {/* 战绩概览 */}
      {!loading && history.length > 0 && (
        <div className="pixel-card mb-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="font-pixel text-white text-lg">{history.length}</p>
              <p className="font-pixel-zh text-gray-500 text-xs">总场次</p>
            </div>
            <div>
              <p className="font-pixel text-green-400 text-lg">{wins}</p>
              <p className="font-pixel-zh text-gray-500 text-xs">胜</p>
            </div>
            <div>
              <p className="font-pixel text-red-400 text-lg">{losses}</p>
              <p className="font-pixel-zh text-gray-500 text-xs">负</p>
            </div>
            <div>
              <p className="font-pixel text-yellow-400 text-lg">{draws}</p>
              <p className="font-pixel-zh text-gray-500 text-xs">平</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <p className="font-pixel text-pixel-green pixel-blink">LOADING...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="pixel-card text-center">
          <p className="font-pixel-zh text-gray-400">暂无对战记录</p>
          <p className="font-pixel-zh text-gray-600 text-sm mt-2">快去对战创造历史吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h) => {
            const r = resultLabel(h.winner);
            return (
              <div key={h.id} className="pixel-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{r.emoji}</span>
                    <span className="font-pixel text-sm" style={{ color: r.color }}>
                      {r.text}
                    </span>
                  </div>
                  <span className="font-pixel text-gray-600 text-xs">{formatTime(h.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-pixel-zh text-pixel-green truncate flex-1">{h.playerName}</span>
                  <span className="font-pixel text-gray-500 text-xs">VS</span>
                  <span className="font-pixel-zh text-red-400 truncate flex-1 text-right">{h.opponentName}</span>
                </div>

                <p className="font-pixel-zh text-gray-500 text-xs mt-2">
                  {h.totalRounds} 回合 · {h.summary}
                </p>
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
