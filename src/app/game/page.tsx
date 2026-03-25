"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, Character } from "@/lib/types";

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [keywords, setKeywords] = useState(["", "", ""]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    setGenerating(true);

    try {
      const res = await fetch("/api/character/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, keywords: keywords.filter(k => k.trim()).join(" ") }),
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
        sessionStorage.removeItem("character");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("删除失败");
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
            <span className="font-pixel text-gray-600 text-xs ml-2">
              #{user.code}
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
              输入 1-3 个关键词，AI 为你生成专属角色。
            </p>
            <p className="font-pixel-zh text-gray-500 text-xs mb-5">
              每个关键词最多5个字 · 留空则随机生成
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
                    onChange={(e) => {
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
              onClick={handleGenerate}
              disabled={generating}
              className="pixel-btn-primary w-full text-base disabled:opacity-50"
            >
              {generating ? "⏳ AI 生成中..." : "⚡ 生成角色"}
            </button>

            {generating && (
              <p className="font-pixel-zh text-gray-500 text-xs text-center mt-3">
                AI 正在构思你的角色，请稍候...
              </p>
            )}
          </div>
        )}

        {/* 有角色：角色详情 */}
        {character && (
          <>
            {/* 角色名和描述 */}
            <div className="pixel-card mb-4">
              <h2 className="font-pixel-zh text-pixel-yellow text-xl mb-1">
                {character.name}
              </h2>
              <p className="font-pixel text-gray-600 text-xs mb-3">
                Keywords: {character.keywords}
              </p>
              <p className="font-pixel-zh text-gray-300 text-sm">
                {character.description}
              </p>
            </div>

            {/* D&D 六维属性 */}
            <div className="pixel-card mb-4">
              <h3 className="font-pixel-zh text-pixel-green text-sm mb-3">
                📊 基础属性
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <StatBar label="力量" abbr="STR" value={character.str} />
                <StatBar label="敏捷" abbr="DEX" value={character.dex} />
                <StatBar label="体质" abbr="CON" value={character.con} />
                <StatBar label="智力" abbr="INT" value={character.int_val} />
                <StatBar label="感知" abbr="WIS" value={character.wis} />
                <StatBar label="魅力" abbr="CHA" value={character.cha} />
              </div>
              <div className="mt-3 text-center">
                <span className="font-pixel text-pixel-red text-xs">
                  HP: {character.max_hp}
                </span>
              </div>
            </div>

            {/* 武器 */}
            {character.weapons?.length > 0 && (
              <div className="pixel-card mb-4">
                <h3 className="font-pixel-zh text-pixel-green text-sm mb-3">
                  ⚔️ 武器
                </h3>
                {character.weapons.map((w, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <div className="flex justify-between">
                      <span className="font-pixel-zh text-pixel-yellow text-sm">
                        {w.name}
                      </span>
                      <span className="font-pixel text-pixel-red text-xs">
                        ATK {w.attack}
                      </span>
                    </div>
                    <p className="font-pixel-zh text-gray-500 text-xs">
                      {w.type} · {w.effect}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 防具 */}
            {character.armors?.length > 0 && (
              <div className="pixel-card mb-4">
                <h3 className="font-pixel-zh text-pixel-green text-sm mb-3">
                  🛡️ 防具
                </h3>
                {character.armors.map((a, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <div className="flex justify-between">
                      <span className="font-pixel-zh text-pixel-yellow text-sm">
                        {a.name}
                      </span>
                      <span className="font-pixel text-pixel-blue text-xs">
                        DEF {a.defense}
                      </span>
                    </div>
                    <p className="font-pixel-zh text-gray-500 text-xs">
                      {a.type} · {a.effect}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 技能 */}
            {character.skills?.length > 0 && (
              <div className="pixel-card mb-4">
                <h3 className="font-pixel-zh text-pixel-green text-sm mb-3">
                  ✨ 技能
                </h3>
                {character.skills.map((s, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <div className="flex justify-between">
                      <span className="font-pixel-zh text-pixel-purple text-sm">
                        {s.name}
                      </span>
                      <span className="font-pixel text-pixel-orange text-xs">
                        DMG {s.damage} · CD {s.cooldown}
                      </span>
                    </div>
                    <p className="font-pixel-zh text-gray-500 text-xs">
                      [{s.source}] {s.effect}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 特殊物品 */}
            {character.items?.length > 0 && (
              <div className="pixel-card mb-4">
                <h3 className="font-pixel-zh text-pixel-green text-sm mb-3">
                  🎒 特殊物品
                </h3>
                {character.items.map((item, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <span className="font-pixel-zh text-pixel-yellow text-sm">
                      {item.name}
                    </span>
                    <p className="font-pixel-zh text-gray-500 text-xs">
                      {item.description}
                    </p>
                    <p className="font-pixel-zh text-gray-600 text-xs">
                      效果：{item.effect}{" "}
                      {item.power > 0 && `(力量 +${item.power})`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => router.push("/battle")}
                className="pixel-btn-primary flex-1 text-base"
              >
                ⚔️ 开始对战
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="pixel-btn-danger text-sm"
              >
                删除
              </button>
            </div>

            {/* 排行榜 + 历史记录 */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => router.push("/rankings")}
                className="pixel-btn-secondary flex-1 text-sm"
              >
                🏆 排行榜
              </button>
              <button
                onClick={() => router.push("/history")}
                className="pixel-btn-secondary flex-1 text-sm"
              >
                📜 历史记录
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

// 属性条组件
function StatBar({
  label,
  abbr,
  value,
}: {
  label: string;
  abbr: string;
  value: number;
}) {
  const percent = ((value - 3) / 17) * 100; // 3-20 映射到 0-100%
  const color =
    value >= 16
      ? "bg-pixel-green"
      : value >= 12
        ? "bg-pixel-yellow"
        : value >= 8
          ? "bg-pixel-orange"
          : "bg-pixel-red";

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-pixel-zh text-gray-400 text-xs">{label}</span>
        <span className="font-pixel text-white text-xs">{value}</span>
      </div>
      <div className="h-2 bg-black border border-gray-700">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="font-pixel text-gray-600 text-xs">{abbr}</span>
    </div>
  );
}
