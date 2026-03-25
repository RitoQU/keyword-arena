"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!name.trim()) {
      setError("请输入名字");
      return;
    }
    if (!code.trim()) {
      setError("请输入识别码");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      // 存储登录信息到 sessionStorage
      sessionStorage.setItem("user", JSON.stringify(data.user));
      if (data.character) {
        sessionStorage.setItem("character", JSON.stringify(data.character));
      }

      // 跳转到主页
      router.push("/game");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="scanline-overlay" />

      <div className="z-10 w-full max-w-sm">
        {/* 标题 */}
        <h1 className="font-pixel text-pixel-green text-xl sm:text-2xl text-center mb-2">
          KEYWORD ARENA
        </h1>
        <p className="font-pixel-zh text-gray-400 text-center mb-8">
          登 录
        </p>

        {/* 登录表单 */}
        <div className="pixel-card">
          {/* 名字输入 */}
          <div className="mb-4">
            <label className="font-pixel-zh text-pixel-green text-sm block mb-2">
              名字（大写英文，最多8位）
            </label>
            <input
              type="text"
              maxLength={8}
              value={name}
              onChange={(e) =>
                setName(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
              }
              placeholder="例：RITO"
              className="pixel-input w-full text-lg tracking-widest"
              disabled={loading}
            />
          </div>

          {/* 识别码输入 */}
          <div className="mb-6">
            <label className="font-pixel-zh text-pixel-green text-sm block mb-2">
              识别码（4位数字）
            </label>
            <input
              type="text"
              maxLength={4}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="例：1234"
              className="pixel-input w-full text-lg tracking-widest"
              disabled={loading}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="font-pixel-zh text-pixel-red text-sm mb-4">
              ⚠ {error}
            </p>
          )}

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="pixel-btn-primary w-full text-base disabled:opacity-50"
          >
            {loading ? "登录中..." : "▶ 进入竞技场"}
          </button>
        </div>

        {/* 说明文字 */}
        <p className="font-pixel-zh text-gray-600 text-xs text-center mt-6">
          新玩家？直接输入名字和识别码即可注册
        </p>

        {/* 返回 */}
        <button
          onClick={() => router.push("/")}
          className="font-pixel-zh text-gray-500 text-sm block mx-auto mt-4 hover:text-gray-300"
        >
          ← 返回首页
        </button>
      </div>
    </main>
  );
}
