import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(_request: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* 边框 */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: "3px solid #333366",
            display: "flex",
          }}
        />

        {/* 角标 */}
        <div style={{ position: "absolute", top: 16, left: 16, width: 12, height: 12, background: "#ffd700", display: "flex" }} />
        <div style={{ position: "absolute", top: 16, right: 16, width: 12, height: 12, background: "#ffd700", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 16, left: 16, width: 12, height: 12, background: "#ffd700", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 16, right: 16, width: 12, height: 12, background: "#ffd700", display: "flex" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ fontSize: 80, display: "flex" }}>⚔️</div>
          <div style={{ fontSize: 56, color: "#ffd700", fontWeight: "bold", letterSpacing: 6, display: "flex" }}>
            KEYWORD ARENA
          </div>
          <div style={{ fontSize: 40, color: "#00ff41", display: "flex" }}>
            关键词竞技场
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#666",
              marginTop: 20,
              display: "flex",
              gap: 12,
            }}
          >
            <span>🎲 输入关键词</span>
            <span style={{ color: "#444" }}>→</span>
            <span>🔨 锻造角色</span>
            <span style={{ color: "#444" }}>→</span>
            <span>⚔️ 回合制对战</span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            fontSize: 18,
            color: "#444",
          }}
        >
          Designed by Rito × Copilot
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
