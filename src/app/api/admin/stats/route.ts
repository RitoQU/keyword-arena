import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "keyword-arena-2026";

export async function GET(request: NextRequest) {
  const password = request.headers.get("x-admin-password");
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    // 并行查询所有数据
    const [usersRes, charsRes, battlesRes] = await Promise.all([
      supabaseAdmin.from("users").select("id, name, code, created_at"),
      supabaseAdmin.from("characters").select("id, user_id, name, keywords, is_system, created_at"),
      supabaseAdmin
        .from("battles")
        .select("id, player_id, player_character_id, opponent_character_id, winner, total_rounds, created_at"),
    ]);

    const users = usersRes.data || [];
    const characters = charsRes.data || [];
    const battles = battlesRes.data || [];

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // 基础统计
    const totalUsers = users.length;
    const totalCharacters = characters.filter((c) => !c.is_system).length;
    const systemCharacters = characters.filter((c) => c.is_system).length;
    const totalBattles = battles.length;

    // 今日统计
    const todayUsers = users.filter((u) => u.created_at?.startsWith(todayStr)).length;
    const todayBattles = battles.filter((b) => b.created_at?.startsWith(todayStr)).length;
    const todayCharacters = characters.filter(
      (c) => !c.is_system && c.created_at?.startsWith(todayStr)
    ).length;

    // 最近7天每日对战数
    const dailyBattles: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      dailyBattles.push({
        date: ds,
        count: battles.filter((b) => b.created_at?.startsWith(ds)).length,
      });
    }

    // 胜率分布
    const winCount = battles.filter((b) => b.winner === "player").length;
    const loseCount = battles.filter((b) => b.winner === "opponent").length;
    const drawCount = battles.filter((b) => b.winner === "draw").length;

    // 热门关键词（玩家角色）
    const keywordCount: Record<string, number> = {};
    for (const c of characters.filter((c) => !c.is_system)) {
      const kws = (c.keywords || "").split("、");
      for (const kw of kws) {
        const trimmed = kw.trim();
        if (trimmed) keywordCount[trimmed] = (keywordCount[trimmed] || 0) + 1;
      }
    }
    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    // 活跃玩家排行（按对战数）
    const playerBattleCount: Record<string, number> = {};
    for (const b of battles) {
      if (b.player_id) playerBattleCount[b.player_id] = (playerBattleCount[b.player_id] || 0) + 1;
    }
    const userMap = new Map(users.map((u) => [u.id, u]));
    const topPlayers = Object.entries(playerBattleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => {
        const u = userMap.get(id);
        return { name: u?.name || "?", code: u?.code || "?", battles: count };
      });

    // 平均回合数
    const avgRounds =
      battles.length > 0
        ? (battles.reduce((sum, b) => sum + (b.total_rounds || 0), 0) / battles.length).toFixed(1)
        : "0";

    return NextResponse.json({
      overview: {
        totalUsers,
        totalCharacters,
        systemCharacters,
        totalBattles,
        todayUsers,
        todayCharacters,
        todayBattles,
        avgRounds,
      },
      dailyBattles,
      winDistribution: { player: winCount, opponent: loseCount, draw: drawCount },
      topKeywords,
      topPlayers,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
