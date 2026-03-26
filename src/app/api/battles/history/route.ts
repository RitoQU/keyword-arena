import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  }

  try {
    // 获取该玩家的所有对战记录（最近 50 条）
    const { data: battles, error: bErr } = await supabaseAdmin
      .from("battles")
      .select("id, player_character_id, opponent_character_id, winner, total_rounds, summary, created_at")
      .eq("player_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (bErr) {
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    if (!battles || battles.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // 获取角色名
    const charIds = [
      ...new Set(battles.flatMap((b) => [b.player_character_id, b.opponent_character_id]).filter(Boolean)),
    ];
    const { data: chars } = charIds.length > 0
      ? await supabaseAdmin.from("characters").select("id, name, keywords").in("id", charIds)
      : { data: [] };

    const charMap = new Map((chars || []).map((c) => [c.id, c]));

    const history = battles.map((b) => {
      const playerChar = charMap.get(b.player_character_id);
      const opponentChar = charMap.get(b.opponent_character_id);
      return {
        id: b.id,
        playerName: playerChar?.name || "已删除角色",
        playerKeywords: playerChar?.keywords || "",
        opponentName: opponentChar?.name || "已删除角色",
        opponentKeywords: opponentChar?.keywords || "",
        winner: b.winner,
        totalRounds: b.total_rounds,
        summary: b.summary,
        createdAt: b.created_at,
      };
    });

    return NextResponse.json({ history });
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
