import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/character/delete - 删除角色
export async function POST(request: NextRequest) {
  try {
    const { userId, characterId } = await request.json();

    if (!userId || !characterId) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    // 验证角色属于该用户
    const { data: character } = await supabaseAdmin
      .from("characters")
      .select("id, user_id")
      .eq("id", characterId)
      .eq("user_id", userId)
      .eq("is_system", false)
      .single();

    if (!character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // 解除 battles 表中对该角色的外键引用（保留对战历史，仅置空关联）
    await supabaseAdmin
      .from("battles")
      .update({ player_character_id: null })
      .eq("player_character_id", characterId);

    await supabaseAdmin
      .from("battles")
      .update({ opponent_character_id: null })
      .eq("opponent_character_id", characterId);

    const { error } = await supabaseAdmin
      .from("characters")
      .delete()
      .eq("id", characterId);

    if (error) {
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
