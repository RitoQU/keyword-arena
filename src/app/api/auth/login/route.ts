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

    // 先按名字查找用户（名字是唯一标识）
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("name", nameUpper)
      .limit(1)
      .single();

    if (existingUser) {
      // 名字已存在 — 校验识别码
      if (existingUser.code !== codeStr) {
        return NextResponse.json(
          { error: "识别码错误，请检查后重试" },
          { status: 401 }
        );
      }

      // 识别码匹配 — 登录成功，查找角色
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

    // 名字不存在 — 创建新用户
    const { data: newUser, error } = await supabaseAdmin
      .from("users")
      .insert({ name: nameUpper, code: codeStr })
      .select()
      .single();

    if (error) {
      // UNIQUE 约束冲突 = 并发注册同名，按"名字已存在"处理
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "该名字刚被其他人注册，请换一个名字" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
    }

    return NextResponse.json({ user: newUser, character: null });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
