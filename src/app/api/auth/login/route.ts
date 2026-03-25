import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/login - 登录或注册
export async function POST(request: NextRequest) {
  try {
    const { name, code } = await request.json();

    // 输入校验
    if (!name || !code) {
      return NextResponse.json({ error: "请输入名字和识别码" }, { status: 400 });
    }

    const nameUpper = String(name).toUpperCase().trim();
    const codeStr = String(code).trim();

    if (!/^[A-Z]{1,8}$/.test(nameUpper)) {
      return NextResponse.json(
        { error: "名字只支持1-8个大写英文字母" },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(codeStr)) {
      return NextResponse.json(
        { error: "识别码必须是4位数字" },
        { status: 400 }
      );
    }

    // 查找用户
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("name", nameUpper)
      .eq("code", codeStr)
      .single();

    if (existingUser) {
      // 用户存在，查找其角色
      const { data: character } = await supabaseAdmin
        .from("characters")
        .select("*")
        .eq("user_id", existingUser.id)
        .eq("is_system", false)
        .single();

      return NextResponse.json({
        user: existingUser,
        character: character || null,
      });
    }

    // 检查名字是否已被占用（名字唯一，code 可重复）
    const { data: nameExists } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("name", nameUpper)
      .limit(1)
      .single();

    if (nameExists) {
      return NextResponse.json(
        { error: `名字「${nameUpper}」已被占用，请换一个名字` },
        { status: 409 }
      );
    }

    // 用户不存在，创建新用户
    const { data: newUser, error } = await supabaseAdmin
      .from("users")
      .insert({ name: nameUpper, code: codeStr })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
    }

    return NextResponse.json({ user: newUser, character: null });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
