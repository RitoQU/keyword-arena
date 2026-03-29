"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAudio } from "@/hooks/useAudio";

interface BossInfo {
  tier: number;
  name: string;
  keywords: string;
  description: string;
  maxHp: number;
  unlocked: boolean;
  defeated: boolean;
  attempts: number;
  unlockCondition: string;
  reward: string;
}

const TIER_EMOJI: Record<number, string> = {
  1: "🗿",
  2: "🗡️",
  3: "⚗️",
  4: "🦖",
  5: "👁️",
};

export default function BossPage() {
  const router = useRouter();
  const [bosses, setBosses] = useState<BossInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [challenging, setChallenging] = useState<number | null>(null);
  const { playSfx, playBgm } = useAudio();

  useEffect(() => {
    playBgm("forge");
  }, [playBgm]);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userData);
    fetchBosses(user.id);
  }, [router]);

  async function fetchBosses(userId: string) {
    try {
      const resp = await fetch(`/api/boss/list?userId=${encodeURIComponent(userId)}`);
      if (resp.ok) {
        const data = await resp.json();
        setBosses(data.bosses || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleChallenge(bossTier: number) {
    const userData = sessionStorage.getItem("user");
    const charData = sessionStorage.getItem("character");
    if (!userData || !charData) {
      router.push("/game");
      return;
    }

    const user = JSON.parse(userData);
    const char = JSON.parse(charData);

    setChallenging(bossTier);
    playSfx("click");

    try {
      const resp = await fetch("/api/boss/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, characterId: char.id, bossTier }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        alert(data.error || "挑战失败");
        setChallenging(null);
        return;
      }

      // 存储战斗结果和 BOSS 战标记到 sessionStorage
      sessionStorage.setItem("bossChallenge", JSON.stringify({
        tier: bossTier,
        bossName: data.result.opponent.name,
        bossProgress: data.bossProgress,
      }));
      sessionStorage.setItem("battleResult", JSON.stringify(data));

      router.push("/battle");
    } catch {
      alert("网络错误，请重试");
      setChallenging(null);
    }
  }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => router.push("/game")}
          className="font-pixel-zh text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          ← 返回
        </button>
      </div>

      <div className="text-center mb-6">
        <h1 className="font-pixel text-pixel-yellow text-lg">👹 BOSS CHALLENGE 👹</h1>
        <p className="font-pixel-zh text-gray-500 text-sm mt-2">击败强大的 BOSS，获得传说称号</p>
      </div>

      {loading ? (
        <div className="text-center">
          <p className="font-pixel text-pixel-green pixel-blink">LOADING...</p>
        </div>
      ) : bosses.length === 0 ? (
        <div className="pixel-card text-center">
          <p className="font-pixel-zh text-gray-400">BOSS 系统尚未开放</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bosses.map((boss) => {
            const isLast = boss.tier === 5;
            const showName = boss.unlocked || boss.defeated || !isLast;

            return (
              <div
                key={boss.tier}
                className={`pixel-card ${
                  boss.defeated
                    ? "border-pixel-yellow"
                    : boss.unlocked
                    ? ""
                    : "opacity-50"
                }`}
                style={boss.defeated ? { borderColor: "#ffd700" } : undefined}
              >
                {/* 头部 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-pixel-yellow text-xs">
                      {boss.defeated ? "✅" : boss.unlocked ? "⭐" : "🔒"} Tier {boss.tier}
                    </span>
                  </div>
                  {boss.defeated && (
                    <span className="font-pixel-zh text-pixel-yellow text-xs">
                      {boss.reward}
                    </span>
                  )}
                </div>

                {/* 名字 + 描述 */}
                <div className="mb-3">
                  <h3 className="font-pixel-zh text-lg mb-1">
                    <span className="mr-1">{TIER_EMOJI[boss.tier]}</span>
                    {showName ? boss.name : "???"}
                  </h3>
                  {boss.unlocked || boss.defeated ? (
                    <>
                      <p className="font-pixel-zh text-gray-400 text-xs leading-relaxed">
                        {boss.description}
                      </p>
                      <p className="font-pixel text-gray-600 text-xs mt-1">
                        HP {boss.maxHp} · {boss.keywords}
                      </p>
                    </>
                  ) : (
                    <p className="font-pixel-zh text-gray-600 text-xs">
                      解锁条件: {isLast ? "???" : boss.unlockCondition}
                    </p>
                  )}
                </div>

                {/* 状态 + 按钮 */}
                {(boss.unlocked || boss.defeated) && (
                  <div className="flex items-center justify-between">
                    <span className="font-pixel-zh text-gray-500 text-xs">
                      {boss.attempts > 0 ? `挑战 ${boss.attempts} 次` : "尚未挑战"}
                    </span>
                    <button
                      onClick={() => handleChallenge(boss.tier)}
                      disabled={challenging !== null}
                      className={`${boss.defeated ? "pixel-btn-secondary" : "pixel-btn-primary"} text-sm px-4 py-2 disabled:opacity-50`}
                    >
                      {challenging === boss.tier
                        ? "挑战中..."
                        : boss.defeated
                        ? "再次挑战"
                        : "⚔️ 挑战"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 没有角色时的提示 */}
      {!loading && !sessionStorage.getItem("character") && (
        <div className="pixel-card text-center mt-4">
          <p className="font-pixel-zh text-gray-400 text-sm">需要先创建角色才能挑战 BOSS</p>
          <button
            onClick={() => router.push("/game")}
            className="pixel-btn-primary mt-3"
          >
            去创建角色
          </button>
        </div>
      )}
    </div>
  );
}
