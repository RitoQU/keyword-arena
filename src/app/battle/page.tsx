"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { BattleResult, BattleAction } from "@/lib/types";

function HpBar({ current, max, side }: { current: number; max: number; side: "left" | "right" }) {
  const pct = Math.max(0, (current / max) * 100);
  const color = pct > 50 ? "#00ff41" : pct > 25 ? "#ffcc00" : "#ff4444";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-pixel mb-1">
        <span style={{ color }}>{Math.round(current)}</span>
        <span className="text-gray-500">/ {max}</span>
      </div>
      <div className="health-bar">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            float: side === "right" ? "right" : "left",
          }}
        />
      </div>
    </div>
  );
}

function ActionLog({ action, index }: { action: BattleAction; index: number }) {
  const isPlayer = action.attacker === "player";
  const bgColor = action.isMiss
    ? "border-gray-600"
    : action.isCrit
    ? "border-yellow-500"
    : isPlayer
    ? "border-green-800"
    : "border-red-800";

  const icon = action.isMiss ? "💨" : action.isCrit ? "💥" : action.actionType === "skill" ? "✨" : action.actionType === "item_trigger" ? "🎯" : "⚔️";

  return (
    <div
      className={`border-l-4 ${bgColor} pl-3 py-2 animate-fadeIn`}
      style={{ animationDelay: `${index * 0.3}s` }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 font-pixel text-xs">R{action.round}</span>
        <span>{icon}</span>
        <span className="font-pixel-zh text-gray-200">{action.description}</span>
      </div>
      {!action.isMiss && (
        <div className="flex gap-4 mt-1 text-xs">
          <span className="text-green-400">
            {action.attackerName === action.defenderName ? "" : `❤️ ${action.playerHp}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function BattlePage() {
  const router = useRouter();
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [visibleActions, setVisibleActions] = useState(0);
  const [battlePhase, setBattlePhase] = useState<"loading" | "fighting" | "result">("loading");
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    const charData = sessionStorage.getItem("character");
    if (userData && charData) {
      const user = JSON.parse(userData);
      const char = JSON.parse(charData);
      startBattle(user.id, char.id);
    } else {
      setError("缺少对战参数，请返回游戏页面");
      setBattlePhase("result");
    }
  }, []);

  async function startBattle(userId: string, characterId: string) {
    try {
      const resp = await fetch("/api/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, characterId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "对战失败");
        setBattlePhase("result");
        return;
      }
      setBattleResult(data.result);
      setBattlePhase("fighting");
    } catch {
      setError("网络错误，请重试");
      setBattlePhase("result");
    }
  }

  // 逐条显示战报
  useEffect(() => {
    if (battlePhase !== "fighting" || !battleResult) return;
    if (visibleActions >= battleResult.rounds.length) {
      const timer = setTimeout(() => setBattlePhase("result"), 1000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setVisibleActions((v) => v + 1);
      // 自动滚动到底部
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [battlePhase, battleResult, visibleActions]);

  if (!battleResult && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-pixel text-pixel-green text-xl pixel-blink">MATCHING...</p>
          <p className="font-pixel-zh text-gray-400 mt-4">正在匹配对手</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="pixel-card max-w-md w-full text-center">
          <p className="text-red-400 font-pixel-zh">{error}</p>
          <button onClick={() => router.push("/game")} className="pixel-btn-primary mt-6">
            返回游戏
          </button>
        </div>
      </div>
    );
  }

  const { player, opponent, winner, rounds, summary } = battleResult!;
  const currentAction = visibleActions > 0 ? rounds[visibleActions - 1] : null;
  const playerHp = currentAction ? currentAction.playerHp : player.max_hp;
  const opponentHp = currentAction ? currentAction.opponentHp : opponent.max_hp;

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* 对战标题 */}
      <div className="text-center mb-6">
        <h1 className="font-pixel text-pixel-yellow text-lg">⚔️ BATTLE ⚔️</h1>
      </div>

      {/* 双方角色信息 + 血条 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 玩家侧 */}
        <div className="pixel-card">
          <p className="font-pixel text-pixel-green text-xs mb-1 truncate">{player.name}</p>
          <p className="font-pixel-zh text-gray-500 text-xs mb-2">{player.keywords}</p>
          <HpBar current={playerHp} max={player.max_hp} side="left" />
          <div className="grid grid-cols-3 gap-1 mt-2 text-xs text-gray-400">
            <span>STR {player.str}</span>
            <span>DEX {player.dex}</span>
            <span>CON {player.con}</span>
          </div>
        </div>

        {/* 对手侧 */}
        <div className="pixel-card">
          <p className="font-pixel text-red-400 text-xs mb-1 truncate">{opponent.name}</p>
          <p className="font-pixel-zh text-gray-500 text-xs mb-2">{opponent.keywords}</p>
          <HpBar current={opponentHp} max={opponent.max_hp} side="right" />
          <div className="grid grid-cols-3 gap-1 mt-2 text-xs text-gray-400">
            <span>STR {opponent.str}</span>
            <span>DEX {opponent.dex}</span>
            <span>CON {opponent.con}</span>
          </div>
        </div>
      </div>

      {/* VS 分隔 */}
      <div className="text-center mb-4">
        <span className="font-pixel text-pixel-yellow text-sm">
          {battlePhase === "fighting" ? `ROUND ${currentAction?.round || 1}` : ""}
        </span>
      </div>

      {/* 战报日志 */}
      <div ref={logRef} className="pixel-card max-h-80 overflow-y-auto mb-6 space-y-2">
        {rounds.slice(0, visibleActions).map((action, i) => (
          <ActionLog key={i} action={action} index={i} />
        ))}
        {battlePhase === "fighting" && visibleActions < rounds.length && (
          <p className="text-gray-500 font-pixel text-xs pixel-blink text-center">...</p>
        )}
      </div>

      {/* 结果展示 */}
      {battlePhase === "result" && battleResult && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className={`pixel-card text-center ${
              winner === "player"
                ? "border-green-500"
                : winner === "opponent"
                ? "border-red-500"
                : "border-yellow-500"
            }`}
            style={{
              borderColor:
                winner === "player" ? "#00ff41" : winner === "opponent" ? "#ff4444" : "#ffcc00",
            }}
          >
            <p
              className="font-pixel text-2xl mb-2"
              style={{
                color:
                  winner === "player" ? "#00ff41" : winner === "opponent" ? "#ff4444" : "#ffcc00",
              }}
            >
              {winner === "player" ? "🏆 VICTORY!" : winner === "opponent" ? "💀 DEFEAT" : "🤝 DRAW"}
            </p>
            <p className="font-pixel-zh text-gray-300 text-sm">{summary}</p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => router.push("/game")} className="pixel-btn-secondary flex-1">
              返回
            </button>
            <button
              onClick={() => {
                setBattlePhase("loading");
                setVisibleActions(0);
                setBattleResult(null);
                const userData = sessionStorage.getItem("user");
                const charData = sessionStorage.getItem("character");
                if (userData && charData) {
                  const user = JSON.parse(userData);
                  const char = JSON.parse(charData);
                  startBattle(user.id, char.id);
                }
              }}
              className="pixel-btn-primary flex-1"
            >
              ⚔️ 再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
