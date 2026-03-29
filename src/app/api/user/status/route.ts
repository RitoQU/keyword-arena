import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "参数缺失" }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("current_streak, max_streak, last_first_win_date, title")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "用户未找到" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  return NextResponse.json({
    currentStreak: user.current_streak ?? 0,
    maxStreak: user.max_streak ?? 0,
    firstWinToday: user.last_first_win_date === today,
    title: user.title ?? null,
  });
}
