"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BattleResult, BattleAction } from "@/lib/types";
import { PixelAvatar } from "@/components/PixelAvatar";
import { useAudio } from "@/hooks/useAudio";

// ─── 血条组件 ───
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

// ─── 战报日志条目 ───
function ActionLog({ action, index }: { action: BattleAction; index: number }) {
  const isPlayer = action.attacker === "player";
  const bgColor = action.isMiss
    ? "border-gray-600"
    : action.isCrit
    ? "border-yellow-500"
    : isPlayer
    ? "border-green-800"
    : "border-red-800";

  const icon = action.isMiss
    ? "💨"
    : action.isCrit
    ? "💥"
    : action.actionType === "skill"
    ? "✨"
    : action.actionType === "item_trigger"
    ? "🎯"
    : "⚔️";

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

// ─── 浮动伤害数字 ───
function FloatingDamage({
  dmg,
}: {
  dmg: { value: number; isCrit: boolean; isMiss: boolean; key: number } | null;
}) {
  if (!dmg) return null;
  if (dmg.isMiss) {
    return (
      <div key={dmg.key} className="absolute -top-4 left-1/2 -translate-x-1/2 font-pixel text-gray-400 text-xs animate-damage-float z-10">
        MISS
      </div>
    );
  }
  return (
    <div
      key={dmg.key}
      className={`absolute -top-4 left-1/2 -translate-x-1/2 font-pixel animate-damage-float z-10 ${
        dmg.isCrit ? "text-yellow-300 text-base" : "text-red-400 text-sm"
      }`}
    >
      {dmg.isCrit ? "💥 " : ""}-{dmg.value}
    </div>
  );
}

// ─── 动画类映射 ───
type AnimState = "idle" | "attack" | "skill" | "item" | "hit" | "death";

function getAnimClass(side: "player" | "opponent", state: AnimState): string {
  switch (state) {
    case "attack":
      return side === "player" ? "animate-pixel-attack-right" : "animate-pixel-attack-left";
    case "skill":
      return side === "player" ? "animate-pixel-skill-right" : "animate-pixel-skill-left";
    case "item":
      return "animate-pixel-item";
    case "hit":
      return "animate-pixel-hit";
    case "death":
      return "animate-pixel-death";
    default:
      return "animate-pixel-idle";
  }
}

// ═══════════════════════════════════════════
// ─── 主页面组件 ───
// ═══════════════════════════════════════════
export default function BattlePage() {
  const router = useRouter();
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [visibleActions, setVisibleActions] = useState(0);
  const [battlePhase, setBattlePhase] = useState<"loading" | "intro" | "fighting" | "result">("loading");
  const [error, setError] = useState("");
  const [opponentCreator, setOpponentCreator] = useState<{ name: string; createdAt: string } | null>(null);
  const [remainingBattles, setRemainingBattles] = useState<number | null>(null);
  const [introStep, setIntroStep] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const { playBgm, playSfx, stopBgm } = useAudio();

  // 动画状态
  const [playerAnim, setPlayerAnim] = useState<AnimState>("idle");
  const [opponentAnim, setOpponentAnim] = useState<AnimState>("idle");
  const [animKey, setAnimKey] = useState(0); // 用于强制重新触发CSS动画
  const [playerDmg, setPlayerDmg] = useState<{ value: number; isCrit: boolean; isMiss: boolean; key: number } | null>(null);
  const [opponentDmg, setOpponentDmg] = useState<{ value: number; isCrit: boolean; isMiss: boolean; key: number } | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);

  // 初始化：开始对战
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

  const startBattle = useCallback(async (userId: string, characterId: string) => {
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
      setOpponentCreator(data.opponentCreator || null);
      setRemainingBattles(data.remainingBattles ?? null);
      setBattlePhase("intro");
    } catch {
      setError("网络错误，请重试");
      setBattlePhase("result");
    }
  }, []);

  // BGM + 场景音效：根据 battlePhase 切换
  useEffect(() => {
    if (battlePhase === "intro") {
      playSfx("intro");
      playBgm("battle");
    } else if (battlePhase === "result" && battleResult) {
      stopBgm();
      playSfx(battleResult.winner === "player" ? "victory" : "defeat");
    }
  }, [battlePhase, battleResult, playBgm, stopBgm, playSfx]);

  // 入场倒计时
  useEffect(() => {
    if (battlePhase !== "intro") return;
    const steps = [
      { delay: 800, step: 1 },
      { delay: 1600, step: 2 },
      { delay: 2400, step: 3 },
      { delay: 3200, step: 4 },
    ];
    const timers = steps.map(({ delay, step }) =>
      setTimeout(() => {
        if (step === 4) setBattlePhase("fighting");
        else setIntroStep(step);
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [battlePhase]);

  // 逐条显示战报
  useEffect(() => {
    if (battlePhase !== "fighting" || !battleResult) return;
    if (visibleActions >= battleResult.rounds.length) {
      const timer = setTimeout(() => setBattlePhase("result"), 1500);
      return () => clearTimeout(timer);
    }
    const delay = visibleActions === 0 ? 1500 : 1200;
    const timer = setTimeout(() => {
      setVisibleActions((v) => v + 1);
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [battlePhase, battleResult, visibleActions]);

  // ─── 核心：每条战报触发动画 + 音效 ───
  useEffect(() => {
    if (visibleActions === 0 || !battleResult) return;
    const action = battleResult.rounds[visibleActions - 1];

    // 攻击音效
    if (action.actionType === "skill") playSfx("skill");
    else if (action.actionType === "item_trigger") playSfx("item");
    else playSfx("attack");
    const isPlayerAttacking = action.attacker === "player";

    // 1) 攻击者 → 攻击动画
    const attackAnim: AnimState =
      action.actionType === "skill" ? "skill" :
      action.actionType === "item_trigger" ? "item" : "attack";

    if (isPlayerAttacking) {
      setPlayerAnim(attackAnim);
    } else {
      setOpponentAnim(attackAnim);
    }
    setAnimKey((k) => k + 1);

    // 2) 300ms后 → 受击者动画 + 浮动伤害 + 打击音效
    const hitTimer = setTimeout(() => {
      const defenderSide = isPlayerAttacking ? "opponent" : "player";
      const dmgData = {
        value: action.damage,
        isCrit: action.isCrit,
        isMiss: action.isMiss,
        key: visibleActions,
      };

      if (!action.isMiss) {
        if (action.isCrit) playSfx("crit");
        if (defenderSide === "player") {
          setPlayerAnim("hit");
          setPlayerDmg(dmgData);
        } else {
          setOpponentAnim("hit");
          setOpponentDmg(dmgData);
        }
        // 暴击屏幕闪烁
        if (action.isCrit) {
          setScreenFlash(true);
          setTimeout(() => setScreenFlash(false), 300);
        }
      } else {
        playSfx("miss");
        // MISS 也显示浮动文字
        if (defenderSide === "player") {
          setPlayerDmg(dmgData);
        } else {
          setOpponentDmg(dmgData);
        }
      }
    }, 300);

    // 3) 800ms后 → 恢复待机/死亡判定
    const resetTimer = setTimeout(() => {
      const isDead = (hp: number) => hp <= 0;
      if (isDead(action.playerHp) || isDead(action.opponentHp)) playSfx("death");
      setPlayerAnim(isDead(action.playerHp) ? "death" : "idle");
      setOpponentAnim(isDead(action.opponentHp) ? "death" : "idle");
      setPlayerDmg(null);
      setOpponentDmg(null);
    }, 900);

    return () => {
      clearTimeout(hitTimer);
      clearTimeout(resetTimer);
    };
  }, [visibleActions, battleResult]);

  // ─── 加载中 ───
  if (!battleResult && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-pixel text-pixel-green text-xl">MATCHING</p>
          <p className="font-pixel text-pixel-green text-xl mt-2 pixel-blink">. . .</p>
          <p className="font-pixel-zh text-gray-400 mt-4">正在匹配对手</p>
        </div>
      </div>
    );
  }

  // ─── 错误 ───
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

  // 获取玩家创建者信息
  const getPlayerCreatorInfo = () => {
    try {
      const u = JSON.parse(sessionStorage.getItem("user") || "{}");
      const c = JSON.parse(sessionStorage.getItem("character") || "{}");
      return `${u.name} · ${c.created_at ? new Date(c.created_at).toLocaleDateString("zh-CN") : ""} 创建`;
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto relative">
      {/* 暴击屏幕闪烁 */}
      {screenFlash && (
        <div className="fixed inset-0 bg-yellow-300 animate-screen-flash z-40 pointer-events-none" />
      )}

      {/* 对战标题 */}
      <div className="text-center mb-4">
        <h1 className="font-pixel text-pixel-yellow text-lg">⚔️ BATTLE ⚔️</h1>
      </div>

      {/* ═══ 战斗竞技场 ═══ */}
      <div className="pixel-card mb-4 relative overflow-hidden" style={{ minHeight: "180px" }}>
        {/* 竞技场背景装饰 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-0 left-0 right-0 h-8" style={{ backgroundColor: "#333366" }} />
        </div>

        {/* 角色对战区 */}
        <div className="flex items-end justify-between px-6 pt-4 pb-2 relative">
          {/* 玩家角色 */}
          <div className={`relative flex flex-col items-center ${battlePhase === "intro" && introStep >= 1 ? "animate-slide-in-left" : battlePhase === "loading" ? "opacity-0" : ""}`}>
            <div className="relative">
              <FloatingDamage dmg={playerDmg} />
              <div
                key={`p-${animKey}-${playerAnim}`}
                className={battlePhase === "fighting" || battlePhase === "result" ? getAnimClass("player", playerAnim) : ""}
              >
                <PixelAvatar character={player} size={6} />
              </div>
            </div>
          </div>

          {/* 中央效果区 */}
          <div className="flex-1 flex items-center justify-center pb-2">
            {battlePhase === "intro" && (
              <>
                {introStep === 1 && (
                  <span className="font-pixel text-pixel-yellow text-3xl animate-pulse">⚡ VS ⚡</span>
                )}
                {introStep === 2 && (
                  <span className="font-pixel text-green-400 text-2xl animate-pulse">READY</span>
                )}
                {introStep === 3 && (
                  <span className="font-pixel text-red-400 text-3xl animate-ping">FIGHT!</span>
                )}
              </>
            )}
            {battlePhase === "fighting" && currentAction && (
              <div className="text-center">
                <span className="font-pixel text-pixel-yellow text-xs">
                  ROUND {currentAction.round}
                </span>
              </div>
            )}
            {battlePhase === "result" && (
              <span
                className="font-pixel text-xl"
                style={{
                  color: winner === "player" ? "#00ff41" : winner === "opponent" ? "#ff4444" : "#ffcc00",
                }}
              >
                {winner === "player" ? "WIN" : winner === "opponent" ? "LOSE" : "DRAW"}
              </span>
            )}
          </div>

          {/* 对手角色 */}
          <div className={`relative flex flex-col items-center ${battlePhase === "intro" && introStep >= 1 ? "animate-slide-in-right" : battlePhase === "loading" ? "opacity-0" : ""}`}>
            <div className="relative">
              <FloatingDamage dmg={opponentDmg} />
              <div
                key={`o-${animKey}-${opponentAnim}`}
                className={battlePhase === "fighting" || battlePhase === "result" ? getAnimClass("opponent", opponentAnim) : ""}
              >
                <PixelAvatar character={opponent} size={6} flip />
              </div>
            </div>
          </div>
        </div>

        {/* 角色名称 + 血条 */}
        <div className="grid grid-cols-2 gap-4 px-4 pb-3">
          {/* 玩家信息 */}
          <div>
            <p className="font-pixel text-pixel-green text-xs mb-1 truncate">{player.name}</p>
            <HpBar current={playerHp} max={player.max_hp} side="left" />
            <p className="font-pixel-zh text-gray-500 text-xs mt-1 truncate">
              {player.keywords?.replace(/、/g, " · ")}
            </p>
          </div>
          {/* 对手信息 */}
          <div className="text-right">
            <p className="font-pixel text-red-400 text-xs mb-1 truncate">{opponent.name}</p>
            <HpBar current={opponentHp} max={opponent.max_hp} side="right" />
            <p className="font-pixel-zh text-gray-500 text-xs mt-1 truncate">
              {opponent.keywords?.replace(/、/g, " · ")}
            </p>
          </div>
        </div>

        {/* 创建者信息 */}
        <div className="grid grid-cols-2 gap-4 px-4 pb-2">
          <p className="font-pixel-zh text-gray-600 text-xs">🎮 {getPlayerCreatorInfo()}</p>
          <p className="font-pixel-zh text-gray-600 text-xs text-right">
            {opponentCreator
              ? `🎮 ${opponentCreator.name} · ${new Date(opponentCreator.createdAt).toLocaleDateString("zh-CN")} 创建`
              : "\u00A0"}
          </p>
        </div>
      </div>

      {/* ═══ 战报日志 ═══ */}
      <div ref={logRef} className="pixel-card max-h-72 overflow-y-auto mb-6 space-y-2">
        {rounds.slice(0, visibleActions).map((action, i) => (
          <ActionLog key={i} action={action} index={i} />
        ))}
        {battlePhase === "fighting" && visibleActions < rounds.length && (
          <p className="text-gray-500 font-pixel text-xs pixel-blink text-center">...</p>
        )}
        {battlePhase === "intro" && (
          <p className="text-gray-500 font-pixel-zh text-sm text-center py-4">准备战斗...</p>
        )}
      </div>

      {/* ═══ 结果展示 ═══ */}
      {battlePhase === "result" && battleResult && (
        <div className="space-y-4 animate-fadeIn pb-28">
          <div
            className="pixel-card text-center"
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

          <details className="group">
            <summary className="pixel-card cursor-pointer flex items-center justify-between list-none text-center">
              <span className="font-pixel-zh text-gray-400 text-xs">📊 对战统计</span>
              <span className="font-pixel text-gray-600 text-xs group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="grid grid-cols-2 gap-4 text-center text-xs">
              <div>
                <p className="font-pixel text-pixel-green mb-1">{player.name}</p>
                <p className="font-pixel-zh text-gray-400">
                  总伤害: {rounds.filter((r) => r.attacker === "player" && !r.isMiss).reduce((s, r) => s + r.damage, 0)}
                </p>
                <p className="font-pixel-zh text-yellow-400">
                  暴击: {rounds.filter((r) => r.attacker === "player" && r.isCrit).length} 次
                </p>
              </div>
              <div>
                <p className="font-pixel text-red-400 mb-1">{opponent.name}</p>
                <p className="font-pixel-zh text-gray-400">
                  总伤害: {rounds.filter((r) => r.attacker === "opponent" && !r.isMiss).reduce((s, r) => s + r.damage, 0)}
                </p>
                <p className="font-pixel-zh text-yellow-400">
                  暴击: {rounds.filter((r) => r.attacker === "opponent" && r.isCrit).length} 次
                </p>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* ━━ 固定底部操作栏（结算后始终可见） ━━ */}
      {battlePhase === "result" && battleResult && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div
            className="max-w-2xl mx-auto px-4 pt-6 pb-5"
            style={{ background: "linear-gradient(transparent, #0a0a0a 40%)" }}
          >
            {remainingBattles !== null && remainingBattles <= 5 && remainingBattles > 0 && (
              <p className="font-pixel-zh text-pixel-yellow text-xs text-center mb-2">
                ⚠️ 今日剩余 {remainingBattles} 场对战
              </p>
            )}
            {remainingBattles !== null && remainingBattles <= 0 && (
              <p className="font-pixel-zh text-pixel-red text-xs text-center mb-2">
                今日对战次数已用完，明天再来吧！
              </p>
            )}
            <div className="flex gap-4">
              <button onClick={() => router.push("/game")} className="pixel-btn-secondary flex-1">
                返回
              </button>
              <button
                onClick={() => {
                  setBattlePhase("loading");
                  setVisibleActions(0);
                  setIntroStep(0);
                  setBattleResult(null);
                  setPlayerAnim("idle");
                  setOpponentAnim("idle");
                  setPlayerDmg(null);
                  setOpponentDmg(null);
                  setAnimKey(0);
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
        </div>
      )}
    </div>
  );
}
