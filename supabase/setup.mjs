// 数据库初始化脚本 - 通过 Supabase REST API 执行 SQL
// 用法: node supabase/setup.mjs

const SUPABASE_URL = "https://ugyznwvkmyqbkvvtqipi.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  console.error("用法: SUPABASE_SERVICE_ROLE_KEY=你的key node supabase/setup.mjs");
  process.exit(1);
}

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "init.sql"), "utf-8");

const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: sql }),
});

// 如果 rpc 不支持，直接用 SQL editor
if (!response.ok) {
  console.log("⚠️  无法通过 API 执行 SQL。请手动执行：");
  console.log("1. 打开 https://supabase.com/dashboard/project/ugyznwvkmyqbkvvtqipi/sql");
  console.log("2. 粘贴 supabase/init.sql 的内容并运行");
} else {
  console.log("✅ 数据库初始化完成！");
}
