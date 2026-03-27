import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "关键词竞技场 | Keyword Arena";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* 边框装饰 */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: "4px solid #333366",
            display: "flex",
          }}
        />

        {/* 角落装饰 */}
        <div style={{ position: "absolute", top: 12, left: 12, width: 16, height: 16, background: "#ffd700", display: "flex" }} />
        <div style={{ position: "absolute", top: 12, right: 12, width: 16, height: 16, background: "#ffd700", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 12, left: 12, width: 16, height: 16, background: "#ffd700", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 12, right: 12, width: 16, height: 16, background: "#ffd700", display: "flex" }} />

        {/* 标题 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ fontSize: 72, color: "#ffd700", fontWeight: "bold", display: "flex" }}>
            ⚔️ KEYWORD ARENA ⚔️
          </div>
          <div style={{ fontSize: 48, color: "#00ff41", display: "flex" }}>
            关键词竞技场
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#888",
              marginTop: 16,
              display: "flex",
              gap: 16,
            }}
          >
            <span>🎲 输入关键词</span>
            <span>→</span>
            <span>🔨 锻造角色</span>
            <span>→</span>
            <span>⚔️ 回合制对战</span>
          </div>
        </div>

        {/* 底部 */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            gap: 8,
            fontSize: 20,
            color: "#555",
          }}
        >
          <span>Designed by Rito × Copilot</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
