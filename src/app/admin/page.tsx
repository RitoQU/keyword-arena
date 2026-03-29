"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminStats {
  overview: {
    totalUsers: number;
    totalCharacters: number;
    systemCharacters: number;
    totalBattles: number;
    todayUsers: number;
    todayCharacters: number;
    todayBattles: number;
    avgRounds: string;
  };
  dailyBattles: { date: string; count: number }[];
  winDistribution: { player: number; opponent: number; draw: number };
  topKeywords: { keyword: string; count: number }[];
  topPlayers: { name: string; battles: number }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchStats(pwd: string) {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": pwd },
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          setError("密码错误");
          setAuthenticated(false);
        } else {
          setError("查询失败");
        }
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setStats(data);
      setAuthenticated(true);
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  }

  // 简易柱状图
  function BarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
    const max = maxVal || Math.max(...data.map((d) => d.value), 1);
    return (
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-pixel text-gray-500 text-xs w-20 text-right shrink-0">{d.label}</span>
            <div className="flex-1 h-5 bg-black border border-gray-700 relative overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%`,
                  backgroundColor: "#00ff41",
                }}
              />
            </div>
            <span className="font-pixel text-pixel-green text-xs w-8">{d.value}</span>
          </div>
        ))}
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="pixel-card max-w-sm w-full text-center">
          <h1 className="font-pixel text-pixel-yellow text-sm mb-6">🔒 ADMIN</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStats(password);
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理密码"
              className="pixel-input w-full mb-4 text-center"
              autoFocus
            />
            <button type="submit" className="pixel-btn-primary w-full" disabled={loading}>
              {loading ? "验证中..." : "进入"}
            </button>
          </form>
          {error && <p className="font-pixel-zh text-red-400 text-sm mt-4">{error}</p>}
          <button
            onClick={() => router.push("/")}
            className="font-pixel-zh text-gray-600 text-xs mt-6 underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, dailyBattles, winDistribution, topKeywords, topPlayers } = stats;
  const totalWins = winDistribution.player + winDistribution.opponent + winDistribution.draw;

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <button onClick={() => router.push("/")} className="font-pixel-zh text-gray-500 text-sm hover:text-gray-300 mb-2">
          ← 返回
        </button>
        <h1 className="font-pixel text-pixel-yellow text-sm">📊 ADMIN DASHBOARD</h1>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "总用户", value: overview.totalUsers, color: "#00ff41" },
          { label: "玩家角色", value: overview.totalCharacters, color: "#00bfff" },
          { label: "系统NPC", value: overview.systemCharacters, color: "#bf00ff" },
          { label: "总对战", value: overview.totalBattles, color: "#ffd700" },
          { label: "今日新用户", value: overview.todayUsers, color: "#00ff41" },
          { label: "今日新角色", value: overview.todayCharacters, color: "#00bfff" },
          { label: "今日对战", value: overview.todayBattles, color: "#ffd700" },
          { label: "平均回合数", value: overview.avgRounds, color: "#ff8c00" },
        ].map((item, i) => (
          <div key={i} className="pixel-card text-center">
            <p className="font-pixel-zh text-gray-500 text-xs mb-1">{item.label}</p>
            <p className="font-pixel text-lg" style={{ color: item.color }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* 近7天对战趋势 */}
      <div className="pixel-card mb-6">
        <h2 className="font-pixel text-pixel-green text-xs mb-4">📈 BATTLES (7 DAYS)</h2>
        <BarChart
          data={dailyBattles.map((d) => ({
            label: d.date.slice(5), // MM-DD
            value: d.count,
          }))}
          maxVal={0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 胜率分布 */}
        <div className="pixel-card">
          <h2 className="font-pixel text-pixel-green text-xs mb-4">🎯 WIN DISTRIBUTION</h2>
          <div className="space-y-3">
            {[
              { label: "玩家胜", count: winDistribution.player, color: "#00ff41" },
              { label: "对手胜", count: winDistribution.opponent, color: "#ff0040" },
              { label: "平局", count: winDistribution.draw, color: "#ffd700" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-pixel-zh text-gray-400 text-xs w-14">{item.label}</span>
                <div className="flex-1 h-5 bg-black border border-gray-700 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${totalWins > 0 ? (item.count / totalWins) * 100 : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="font-pixel text-xs w-16 text-right" style={{ color: item.color }}>
                  {item.count} ({totalWins > 0 ? ((item.count / totalWins) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 活跃玩家 */}
        <div className="pixel-card">
          <h2 className="font-pixel text-pixel-green text-xs mb-4">🏆 TOP PLAYERS</h2>
          <div className="space-y-2">
            {topPlayers.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-pixel text-gray-500 text-xs w-6">#{i + 1}</span>
                <span className="font-pixel-zh text-gray-300 text-sm flex-1">
                  {p.name}
                </span>
                <span className="font-pixel text-pixel-yellow text-xs">{p.battles} 场</span>
              </div>
            ))}
            {topPlayers.length === 0 && (
              <p className="font-pixel-zh text-gray-600 text-xs text-center">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      {/* 热门关键词 */}
      <div className="pixel-card mb-6">
        <h2 className="font-pixel text-pixel-green text-xs mb-4">🔥 TOP KEYWORDS</h2>
        <div className="flex flex-wrap gap-2">
          {topKeywords.map((kw, i) => (
            <span
              key={i}
              className="font-pixel-zh text-xs px-2 py-1 border"
              style={{
                borderColor: i < 3 ? "#ffd700" : i < 10 ? "#00ff41" : "#333366",
                color: i < 3 ? "#ffd700" : i < 10 ? "#00ff41" : "#999",
                backgroundColor: "#000",
              }}
            >
              {kw.keyword} ×{kw.count}
            </span>
          ))}
          {topKeywords.length === 0 && (
            <p className="font-pixel-zh text-gray-600 text-xs">暂无数据</p>
          )}
        </div>
      </div>

      {/* 刷新按钮 */}
      <div className="text-center">
        <button
          onClick={() => fetchStats(password)}
          className="pixel-btn-secondary text-xs py-2 px-6"
          disabled={loading}
        >
          {loading ? "加载中..." : "🔄 刷新数据"}
        </button>
      </div>
    </div>
  );
}
