import { supabaseAdmin } from "@/lib/supabase-admin";
import { runBattle } from "@/lib/battle-engine";
import { NextRequest, NextResponse } from "next/server";
import type { Character } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { userId, characterId } = await request.json();

    if (!userId || !characterId) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    // 检查每日对战限额
    const today = new Date().toISOString().split("T")[0];
    const { data: limit } = await supabaseAdmin
      .from("daily_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (limit && limit.battles >= 50) {
      return NextResponse.json(
        { error: "今日对战次数已用完（50/50），请明天再来！" },
        { status: 429 }
      );
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

    // 查询该角色已经打过的对手
    const { data: pastBattles } = await supabaseAdmin
      .from("battles")
      .select("opponent_character_id")
      .eq("player_character_id", characterId);
    const foughtIds = new Set((pastBattles || []).map(b => b.opponent_character_id));

    // 匹配对手：优先未打过的真人角色 → 未打过的系统角色 → 已打过的全部角色
    const { data: rawOpponents, error: oppErr } = await supabaseAdmin
      .from("characters")
      .select("*")
      .or(`user_id.neq.${userId},user_id.is.null`);

    const allOpponents = (rawOpponents || []) as Character[];

    if (oppErr || allOpponents.length === 0) {
      return NextResponse.json(
        { error: "没有可匹配的对手，请等待更多玩家加入！" },
        { status: 404 }
      );
    }

    // 分组：未打过的真人 > 未打过的系统 > 已打过的全部
    const unfoughtReal = allOpponents.filter(c => !foughtIds.has(c.id) && c.user_id !== null);
    const unfoughtSystem = allOpponents.filter(c => !foughtIds.has(c.id) && c.user_id === null);
    const pool = unfoughtReal.length > 0 ? unfoughtReal
      : unfoughtSystem.length > 0 ? unfoughtSystem
      : allOpponents;

    const opponentChar = pool[Math.floor(Math.random() * pool.length)];

    // 获取对手的创建者信息（如果是玩家角色）
    let opponentCreator: { name: string; createdAt: string } | null = null;
    if (opponentChar.user_id) {
      const { data: creatorUser } = await supabaseAdmin
        .from("users")
        .select("name, created_at")
        .eq("id", opponentChar.user_id)
        .single();
      if (creatorUser) {
        opponentCreator = { name: creatorUser.name, createdAt: creatorUser.created_at };
      }
    }

    // 执行战斗
    const battleResult = runBattle(playerChar as Character, opponentChar);

    // 保存战斗记录
    const { data: battle, error: insertErr } = await supabaseAdmin
      .from("battles")
      .insert({
        player_id: userId,
        player_character_id: characterId,
        opponent_character_id: opponentChar.id,
        winner: battleResult.winner,
        rounds: battleResult.rounds,
        total_rounds: battleResult.totalRounds,
        summary: battleResult.summary,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Battle insert error:", insertErr);
      return NextResponse.json({ error: "保存对战记录失败" }, { status: 500 });
    }

    // 更新每日对战计数
    if (limit) {
      await supabaseAdmin
        .from("daily_limits")
        .update({ battles: limit.battles + 1 })
        .eq("id", limit.id);
    } else {
      await supabaseAdmin.from("daily_limits").insert({
        user_id: userId,
        date: today,
        generations: 0,
        battles: 1,
      });
    }

    // ─── 连胜 + 首胜计算 ───
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("current_streak, max_streak, last_first_win_date")
      .eq("id", userId)
      .single();

    const prevStreak = userData?.current_streak ?? 0;
    const prevMax = userData?.max_streak ?? 0;
    const lastFirstWinDate = userData?.last_first_win_date;

    let newStreak = prevStreak;
    let newMax = prevMax;
    let isFirstWinToday = false;
    let streakBroken: number | null = null;
    let streakMilestone: string | null = null;

    if (battleResult.winner === "player") {
      newStreak = prevStreak + 1;
      newMax = Math.max(newStreak, prevMax);

      // 首胜判定
      if (lastFirstWinDate !== today) {
        isFirstWinToday = true;
      }

      // 里程碑判定
      if (newStreak >= 10) streakMilestone = "streak_10";
      else if (newStreak >= 7) streakMilestone = "streak_7";
      else if (newStreak >= 5) streakMilestone = "streak_5";
      else if (newStreak >= 3) streakMilestone = "streak_3";

      await supabaseAdmin
        .from("users")
        .update({
          current_streak: newStreak,
          max_streak: newMax,
          ...(isFirstWinToday ? { last_first_win_date: today } : {}),
        })
        .eq("id", userId);
    } else {
      // 输或平 → 连胜归零
      if (prevStreak >= 3) {
        streakBroken = prevStreak;
      }
      newStreak = 0;
      await supabaseAdmin
        .from("users")
        .update({ current_streak: 0 })
        .eq("id", userId);
    }

    return NextResponse.json({
      battleId: battle.id,
      result: {
        ...battleResult,
        id: battle.id,
        created_at: battle.created_at,
      },
      opponentCreator,
      remainingBattles: 50 - ((limit?.battles || 0) + 1),
      streak: {
        current: newStreak,
        max: newMax,
        milestone: streakMilestone,
        broken: streakBroken,
      },
      firstWin: {
        isFirstToday: isFirstWinToday,
        alreadyClaimed: lastFirstWinDate === today && !isFirstWinToday,
      },
    });
  } catch (err) {
    console.error("Battle API error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
