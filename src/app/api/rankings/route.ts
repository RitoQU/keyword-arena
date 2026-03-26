import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 获取所有对战记录
    const { data: battles, error: bErr } = await supabaseAdmin
      .from("battles")
      .select("player_id, player_character_id, opponent_character_id, winner");

    if (bErr) {
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    // 统计每个玩家的胜/负/平
    const stats: Record<string, { wins: number; losses: number; draws: number; total: number; characterId: string }> = {};

    for (const b of battles || []) {
      if (!b.player_id) continue;
      if (!stats[b.player_id]) {
        stats[b.player_id] = { wins: 0, losses: 0, draws: 0, total: 0, characterId: b.player_character_id };
      }
      stats[b.player_id].total += 1;
      stats[b.player_id].characterId = b.player_character_id; // 最新使用的角色
      if (b.winner === "player") stats[b.player_id].wins += 1;
      else if (b.winner === "opponent") stats[b.player_id].losses += 1;
      else stats[b.player_id].draws += 1;
    }

    // 获取用户名和角色名
    const playerIds = Object.keys(stats);
    if (playerIds.length === 0) {
      return NextResponse.json({ rankings: [] });
    }

    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .in("id", playerIds);

    const charIds = [...new Set(Object.values(stats).map((s) => s.characterId))];
    const { data: chars } = await supabaseAdmin
      .from("characters")
      .select("id, name")
      .in("id", charIds);

    const userMap = new Map((users || []).map((u) => [u.id, u]));
    const charMap = new Map((chars || []).map((c) => [c.id, c.name]));

    // 排名：按胜率排序，胜场相同按总场次
    const rankings = playerIds
      .map((pid) => {
        const s = stats[pid];
        const user = userMap.get(pid);
        return {
          userId: pid,
          userName: user ? user.name : "Unknown",
          characterName: charMap.get(s.characterId) || "Unknown",
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          total: s.total,
          winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.total - a.total)
      .slice(0, 50);

    return NextResponse.json({ rankings });
  } catch (err) {
    console.error("Rankings error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
