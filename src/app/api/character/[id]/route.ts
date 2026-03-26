import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "缺少角色 ID" }, { status: 400 });
  }

  try {
    const { data: character, error } = await supabaseAdmin
      .from("characters")
      .select("id, name, keywords, description, str, dex, con, int_val, wis, cha, max_hp, weapons, armors, skills, items, user_id, created_at")
      .eq("id", id)
      .single();

    if (error || !character) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // 获取创建者名称
    let ownerName = "系统角色";
    if (character.user_id) {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("name")
        .eq("id", character.user_id)
        .single();
      if (user) ownerName = user.name;
    }

    return NextResponse.json({
      character: {
        ...character,
        ownerName,
        user_id: undefined, // 不暴露 user_id
      },
    });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
