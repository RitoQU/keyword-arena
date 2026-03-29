import { supabaseAdmin } from "@/lib/supabase-admin";
import { runBattle } from "@/lib/battle-engine";
import { NextRequest, NextResponse } from "next/server";
import type { Character } from "@/lib/types";

// BOSS 称号映射
const BOSS_TITLES: Record<number, string> = {
  1: "碎石者",
  2: "破影人",
  3: "祛魔师",
  4: "驯兽者",
  5: "虚空征服者",
};

export async function POST(request: NextRequest) {
  try {
    const { userId, characterId, bossTier } = await request.json();

    if (!userId || !characterId || !bossTier) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    // 获取玩家角色
    const { data: playerChar, error: playerErr } = await supabaseAdmin
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .eq("user_id", userId)
      .single();

    if (playerErr || !playerChar) {
      return NextResponse.json({ error: "找不到你的角色" }, { status: 404 });
    }

    // 获取 BOSS 角色
    const { data: bossChar, error: bossErr } = await supabaseAdmin
      .from("characters")
      .select("*")
      .eq("boss_tier", bossTier)
      .eq("is_system", true)
      .single();

    if (bossErr || !bossChar) {
      return NextResponse.json({ error: "BOSS 不存在" }, { status: 404 });
    }

    // 验证解锁条件
    const unlocked = await checkBossUnlock(userId, bossTier);
    if (!unlocked) {
      return NextResponse.json({ error: "BOSS 尚未解锁" }, { status: 403 });
    }

    // 执行战斗（复用战斗引擎）
    const battleResult = runBattle(playerChar as Character, bossChar as Character);

    // 保存战斗记录（不消耗每日对战次数）
    const { data: battle, error: insertErr } = await supabaseAdmin
      .from("battles")
      .insert({
        player_id: userId,
        player_character_id: characterId,
        opponent_character_id: bossChar.id,
        winner: battleResult.winner,
        rounds: battleResult.rounds,
        total_rounds: battleResult.totalRounds,
        summary: battleResult.summary,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Boss battle insert error:", insertErr);
      return NextResponse.json({ error: "保存对战记录失败" }, { status: 500 });
    }

    // 更新 BOSS 进度
    const { data: existing } = await supabaseAdmin
      .from("user_boss_progress")
      .select("id, defeated, attempts")
      .eq("user_id", userId)
      .eq("boss_tier", bossTier)
      .single();

    const isFirstDefeat = battleResult.winner === "player" && !existing?.defeated;

    if (existing) {
      await supabaseAdmin
        .from("user_boss_progress")
        .update({
          attempts: existing.attempts + 1,
          ...(isFirstDefeat ? { defeated: true, defeated_at: new Date().toISOString() } : {}),
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("user_boss_progress").insert({
        user_id: userId,
        boss_tier: bossTier,
        defeated: battleResult.winner === "player",
        attempts: 1,
        ...(battleResult.winner === "player" ? { defeated_at: new Date().toISOString() } : {}),
      });
    }

    // 首次击败 → 授予称号
    if (isFirstDefeat) {
      const title = BOSS_TITLES[bossTier as number];
      if (title) {
        await supabaseAdmin
          .from("users")
          .update({ title })
          .eq("id", userId);
      }
    }

    return NextResponse.json({
      battleId: battle.id,
      result: {
        ...battleResult,
        id: battle.id,
        created_at: battle.created_at,
      },
      bossProgress: {
        tier: bossTier,
        defeated: battleResult.winner === "player" || (existing?.defeated ?? false),
        attempts: (existing?.attempts ?? 0) + 1,
        isFirstDefeat,
        rewardTitle: isFirstDefeat ? BOSS_TITLES[bossTier as number] : null,
      },
    });
  } catch (err) {
    console.error("Boss challenge API error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/** 验证 BOSS 解锁条件 */
async function checkBossUnlock(userId: string, bossTier: number): Promise<boolean> {
  switch (bossTier) {
    case 1: {
      const { count } = await supabaseAdmin
        .from("battles")
        .select("id", { count: "exact", head: true })
        .eq("player_id", userId);
      return (count ?? 0) >= 2;
    }
    case 2: {
      const { data } = await supabaseAdmin
        .from("user_boss_progress")
        .select("defeated")
        .eq("user_id", userId)
        .eq("boss_tier", 1)
        .single();
      return data?.defeated ?? false;
    }
    case 3: {
      const { data } = await supabaseAdmin
        .from("user_boss_progress")
        .select("defeated")
        .eq("user_id", userId)
        .eq("boss_tier", 2)
        .single();
      if (!data?.defeated) return false;
      const { count } = await supabaseAdmin
        .from("battles")
        .select("id", { count: "exact", head: true })
        .eq("player_id", userId)
        .eq("winner", "player");
      return (count ?? 0) >= 2;
    }
    case 4: {
      const { data } = await supabaseAdmin
        .from("user_boss_progress")
        .select("defeated")
        .eq("user_id", userId)
        .eq("boss_tier", 3)
        .single();
      if (!data?.defeated) return false;
      const { count } = await supabaseAdmin
        .from("battles")
        .select("id", { count: "exact", head: true })
        .eq("player_id", userId)
        .eq("winner", "player");
      return (count ?? 0) >= 5;
    }
    case 5: {
      const { data: prog } = await supabaseAdmin
        .from("user_boss_progress")
        .select("defeated")
        .eq("user_id", userId)
        .eq("boss_tier", 4)
        .single();
      if (!prog?.defeated) return false;
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("current_streak")
        .eq("id", userId)
        .single();
      return (userData?.current_streak ?? 0) >= 3;
    }
    default:
      return false;
  }
}
