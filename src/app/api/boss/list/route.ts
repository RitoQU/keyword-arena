import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

// BOSS 称号映射
const BOSS_TITLES: Record<number, string> = {
  1: "碎石者",
  2: "破影人",
  3: "祛魔师",
  4: "驯兽者",
  5: "虚空征服者",
};

// BOSS 解锁条件描述
const UNLOCK_DESC: Record<number, string> = {
  1: "完成 2 场普通对战",
  2: "击败守卫石像",
  3: "击败暗影刺客 + 再赢 2 场",
  4: "击败炼金贤者 + 再赢 3 场",
  5: "击败裂地巨兽 + 当前连胜 ≥3",
};

// BOSS 奖励描述
const BOSS_REWARDS: Record<number, string> = {
  1: "称号「碎石者」",
  2: "称号「破影人」",
  3: "称号「祛魔师」",
  4: "称号「驯兽者」",
  5: "称号「虚空征服者」✨",
};

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "参数缺失" }, { status: 400 });
  }

  // 查询所有 BOSS 角色
  const { data: bosses } = await supabaseAdmin
    .from("characters")
    .select("id, name, keywords, description, visual, boss_tier, str, dex, con, int_val, wis, cha, max_hp")
    .not("boss_tier", "is", null)
    .order("boss_tier", { ascending: true });

  if (!bosses || bosses.length === 0) {
    return NextResponse.json({ bosses: [] });
  }

  // 查询用户 BOSS 进度
  const { data: progress } = await supabaseAdmin
    .from("user_boss_progress")
    .select("boss_tier, defeated, attempts")
    .eq("user_id", userId);

  const progressMap = new Map(
    (progress || []).map(p => [p.boss_tier, p])
  );

  // 查询解锁条件所需数据
  const { count: totalBattles } = await supabaseAdmin
    .from("battles")
    .select("id", { count: "exact", head: true })
    .eq("player_id", userId);

  const { count: totalWins } = await supabaseAdmin
    .from("battles")
    .select("id", { count: "exact", head: true })
    .eq("player_id", userId)
    .eq("winner", "player");

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("current_streak")
    .eq("id", userId)
    .single();

  const currentStreak = userData?.current_streak ?? 0;

  // 判定每个 BOSS 的解锁状态
  const result = bosses.map(boss => {
    const tier = boss.boss_tier as number;
    const prog = progressMap.get(tier);
    const defeated = prog?.defeated ?? false;
    const attempts = prog?.attempts ?? 0;

    let unlocked = false;
    switch (tier) {
      case 1:
        unlocked = (totalBattles ?? 0) >= 2;
        break;
      case 2:
        unlocked = progressMap.get(1)?.defeated ?? false;
        break;
      case 3:
        unlocked = (progressMap.get(2)?.defeated ?? false) && (totalWins ?? 0) >= 2;
        break;
      case 4:
        unlocked = (progressMap.get(3)?.defeated ?? false) && (totalWins ?? 0) >= 5;
        break;
      case 5:
        unlocked = (progressMap.get(4)?.defeated ?? false) && currentStreak >= 3;
        break;
    }

    return {
      tier,
      name: boss.name,
      keywords: boss.keywords,
      description: boss.description,
      visual: boss.visual,
      maxHp: boss.max_hp,
      unlocked,
      defeated,
      attempts,
      unlockCondition: UNLOCK_DESC[tier],
      reward: BOSS_REWARDS[tier],
    };
  });

  return NextResponse.json({ bosses: result });
}
