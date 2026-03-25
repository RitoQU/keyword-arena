// 本地环境变量加载 + 运行 seed
import { readFileSync } from "fs";
const envContent = readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}
// 动态导入 seed 脚本
await import("./seed-npcs.mjs");
