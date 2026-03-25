"use client";

import { useMemo } from "react";

/* ===================================================================
   PixelAvatar v2 — 关键词感知的像素角色精灵系统
   20+ 原型模板 × 模块化叠加层 × 确定性配色
   =================================================================== */

// 像素类型索引
const E = 0;  // 空
const S = 1;  // 皮肤
const P = 2;  // 主色（服装/身体）
const A = 3;  // 强调色/副色
const X = 4;  // 眼睛
const H = 5;  // 头发/头部特征
const W = 6;  // 武器/持有物
const F = 7;  // 特殊色（翅膀/光环/坐骑等）

// ---- 视觉配置接口 ----
export interface VisualConfig {
  archetype: string;
  hat?: string;
  wings?: string;
  aura?: string;
  held?: string;
  mount?: string;
  palette?: number;
}

interface PixelAvatarProps {
  character: {
    id?: string;
    name: string;
    keywords?: string;
    description?: string;
    str: number;
    dex: number;
    con: number;
    int_val: number;
    wis: number;
    cha: number;
    visual?: VisualConfig | null;
    weapons?: { type: string }[];
  };
  size?: number;
  flip?: boolean;
  className?: string;
}

/* ===================================================================
   原型精灵模板 — 12行 × 12列，FC风格的差异化轮廓
   每个原型都有独特剪影，让玩家一眼识别角色类型
   =================================================================== */

// 约定：所有模板都是 12×12 完整矩阵

const ARCHETYPES: Record<string, number[][]> = {
  // 战士 — 壮硕、执剑
  warrior: [
    [E,E,E,H,H,H,H,H,E,E,E,E],
    [E,E,H,H,H,H,H,H,H,E,E,E],
    [E,E,H,S,S,X,X,S,H,E,E,E],
    [E,E,E,S,S,S,S,S,E,E,E,E],
    [E,E,P,P,P,P,P,P,P,W,E,E],
    [E,P,S,P,P,A,P,P,S,W,E,E],
    [E,E,E,P,P,A,P,P,E,W,E,E],
    [E,E,E,P,P,P,P,P,E,W,E,E],
    [E,E,E,E,P,E,P,E,E,W,E,E],
    [E,E,E,E,P,E,P,E,E,E,E,E],
    [E,E,E,E,A,E,A,E,E,E,E,E],
    [E,E,E,A,A,E,A,A,E,E,E,E],
  ],

  // 法师 — 尖帽、法杖、长袍
  mage: [
    [E,E,E,E,A,A,E,E,E,E,E,E],
    [E,E,E,A,A,H,A,E,E,E,E,E],
    [E,E,A,H,H,H,H,A,E,E,E,E],
    [E,E,E,H,S,X,S,E,E,E,E,E],
    [E,E,E,E,S,S,S,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,P,E,E,E],
    [E,P,P,P,P,A,P,P,P,P,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,P,P,P,P,P,P,P,P,E,E,E],
    [P,P,E,E,P,E,P,E,E,E,W,E],
    [E,E,E,E,A,E,A,E,E,W,A,W],
    [E,E,E,E,P,E,P,E,E,E,W,E],
  ],

  // 刺客/盗贼 — 兜帽、匕首、敏捷体型
  rogue: [
    [E,E,E,A,A,A,A,E,E,E,E,E],
    [E,E,A,A,H,H,A,A,E,E,E,E],
    [E,E,A,S,S,X,S,A,E,E,E,E],
    [E,E,E,E,S,S,S,E,E,E,E,E],
    [E,E,E,P,P,P,P,P,E,E,E,E],
    [E,E,S,P,P,A,P,P,S,E,E,E],
    [E,E,E,P,P,P,P,P,E,E,E,E],
    [E,E,E,P,P,A,P,E,E,E,E,E],
    [E,E,E,E,P,E,P,E,E,E,E,E],
    [E,E,E,E,P,E,P,E,E,E,E,E],
    [E,E,E,E,A,E,A,E,E,E,E,E],
    [E,E,E,E,A,E,A,E,E,E,E,E],
  ],

  // 重甲/坦克 — 宽肩、大盾
  tank: [
    [E,E,E,H,H,H,H,H,E,E,E,E],
    [E,E,H,H,H,H,H,H,H,E,E,E],
    [E,E,H,S,S,X,S,S,H,E,E,E],
    [E,E,E,S,S,S,S,S,E,E,E,E],
    [E,P,P,P,P,P,P,P,P,P,E,E],
    [W,P,S,P,P,A,P,P,S,P,W,E],
    [W,P,E,P,P,A,P,P,E,P,W,E],
    [W,E,E,P,P,P,P,P,E,E,W,E],
    [E,E,E,P,P,E,P,P,E,E,E,E],
    [E,E,E,P,P,E,P,P,E,E,E,E],
    [E,E,E,A,A,E,A,A,E,E,E,E],
    [E,E,A,A,A,E,A,A,A,E,E,E],
  ],

  // 龙/蜥蜴 — 长嘴、翅膀轮廓、尾巴
  dragon: [
    [E,E,F,E,E,E,E,E,F,E,E,E],
    [E,E,E,F,A,A,A,F,E,E,E,E],
    [E,E,E,P,P,P,P,P,E,E,E,E],
    [E,E,P,P,X,P,X,P,P,E,E,E],
    [E,E,P,P,P,P,P,P,A,A,E,E],
    [E,F,E,P,P,P,P,P,E,F,E,E],
    [F,E,E,P,P,A,P,P,E,E,F,E],
    [E,E,E,E,P,P,P,E,E,E,E,E],
    [E,E,E,P,P,E,P,P,E,E,E,E],
    [E,E,E,P,E,E,E,P,E,E,E,E],
    [E,E,E,A,E,E,E,A,A,E,E,E],
    [E,E,E,E,E,E,E,E,A,A,E,E],
  ],

  // 吸血鬼 — 高立领、尖牙、披风
  vampire: [
    [E,E,E,H,H,H,H,E,E,E,E,E],
    [E,E,H,H,H,H,H,H,E,E,E,E],
    [E,E,H,S,S,X,S,H,E,E,E,E],
    [E,E,E,S,A,S,A,E,E,E,E,E],
    [E,A,P,P,P,P,P,P,A,E,E,E],
    [A,A,P,P,P,P,P,P,A,A,E,E],
    [A,E,P,P,P,A,P,P,E,A,E,E],
    [A,E,E,P,P,P,P,E,E,A,E,E],
    [A,E,E,E,P,E,P,E,E,A,E,E],
    [E,A,E,E,P,E,P,E,A,E,E,E],
    [E,E,A,E,A,E,A,A,E,E,E,E],
    [E,E,E,A,A,E,A,A,E,E,E,E],
  ],

  // 婴儿/幼小 — 大头、小身体、比例夸张
  baby: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,S,S,S,S,E,E,E,E,E],
    [E,E,S,S,S,S,S,S,E,E,E,E],
    [E,E,S,S,S,S,S,S,E,E,E,E],
    [E,E,S,X,S,S,X,S,E,E,E,E],
    [E,E,E,S,S,S,S,E,E,E,E,E],
    [E,E,E,S,S,A,S,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,E,E,E,A,A,E,E,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 机器人 — 方形头、天线、金属质感
  robot: [
    [E,E,E,E,A,A,E,E,E,E,E,E],
    [E,E,E,E,A,A,E,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,P,X,P,P,X,P,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,P,P,A,A,P,P,E,E,E,E],
    [E,A,P,P,P,P,P,P,A,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,E,P,A,A,P,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,P,E,E,P,P,E,E,E,E],
    [E,E,A,A,E,E,A,A,E,E,E,E],
  ],

  // 精灵/仙女 — 尖耳、轻盈、自带光翼轮廓
  fairy: [
    [E,E,E,E,H,H,E,E,E,E,E,E],
    [E,E,E,H,H,H,H,E,E,E,E,E],
    [E,E,H,S,S,S,S,H,E,E,E,E],
    [E,F,E,S,X,S,X,E,F,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,F,F,P,P,P,P,F,F,E,E,E],
    [F,F,E,P,P,A,P,E,F,F,E,E],
    [E,F,E,P,P,P,P,E,F,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 幽灵/灵体 — 飘浮、无腿、半透明轮廓
  ghost: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,P,X,P,P,X,P,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,P,P,A,A,P,P,E,E,E,E],
    [E,P,P,P,P,P,P,P,P,E,E,E],
    [E,P,P,P,P,P,P,P,P,E,E,E],
    [E,P,E,P,P,P,P,E,P,E,E,E],
    [E,P,E,P,E,E,P,E,P,E,E,E],
    [E,E,E,P,E,E,P,E,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 史莱姆/软体 — 圆润、弹性体
  slime: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,P,P,X,P,P,X,P,P,E,E,E],
    [E,P,P,P,P,P,P,P,P,E,E,E],
    [P,P,P,P,A,A,P,P,P,P,E,E],
    [P,P,P,P,P,P,P,P,P,P,E,E],
    [E,P,P,P,P,P,P,P,P,E,E,E],
    [E,E,A,P,P,P,P,A,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 骑士（骑坐骑）— 上半人、下半马/兽
  rider: [
    [E,E,E,E,H,H,E,E,E,E,E,E],
    [E,E,E,H,H,H,H,E,E,E,E,E],
    [E,E,E,H,S,X,S,E,E,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,E,E,P,P,P,A,E,E,E,E,E],
    [E,E,E,P,P,P,P,F,E,E,E,E],
    [E,E,F,F,F,F,F,F,F,E,E,E],
    [E,F,F,F,F,F,F,F,F,F,E,E],
    [E,F,E,F,F,F,F,E,E,F,E,E],
    [E,F,E,F,E,E,F,E,E,F,E,E],
    [E,A,E,A,E,E,A,E,E,A,E,E],
    [E,A,E,A,E,E,A,E,E,A,E,E],
  ],

  // 昆虫 — 复眼、六足、触角
  insect: [
    [E,E,F,E,E,E,E,F,E,E,E,E],
    [E,E,E,F,E,E,F,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,X,P,P,X,P,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,E,E,A,A,E,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,A,E,P,P,P,P,E,A,E,E,E],
    [A,E,E,P,P,P,P,E,E,A,E,E],
    [E,E,E,A,E,E,A,E,E,E,E,E],
    [E,E,A,E,E,E,E,A,E,E,E,E],
    [E,A,E,E,E,E,E,E,A,E,E,E],
  ],

  // 动物（猫/狗类四足）— 四脚、尾巴
  beast: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,F,E,E,E,E,E,E,F,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,P,X,P,P,X,P,E,E,E,E],
    [E,E,P,P,P,S,P,P,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,P,P,P,P,P,P,P,P,A,E,E],
    [E,P,P,P,P,P,P,P,P,A,E,E],
    [E,E,P,E,E,E,E,P,E,A,E,E],
    [E,E,P,E,E,E,E,P,E,E,E,E],
    [E,E,A,E,E,E,E,A,E,E,E,E],
  ],

  // 鸟类 — 翅膀展开、喙
  bird: [
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,X,P,P,X,P,E,E,E,E],
    [E,E,E,P,P,A,P,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,F,F,P,P,P,P,F,F,E,E,E],
    [F,F,E,P,P,P,P,E,F,F,E,E],
    [F,E,E,P,P,P,P,E,E,F,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,A,A,E,E,E,E,E,E],
    [E,E,E,A,E,E,A,E,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 树人/植物 — 粗壮树干、枝叶
  plant: [
    [E,E,E,F,F,F,F,E,E,E,E,E],
    [E,E,F,F,F,F,F,F,E,E,E,E],
    [E,F,F,F,F,F,F,F,F,E,E,E],
    [E,E,F,F,F,F,F,F,E,E,E,E],
    [E,E,E,P,X,X,P,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,F,E,P,P,P,P,E,F,E,E,E],
    [E,E,F,P,P,P,P,F,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,A,P,E,E,P,A,E,E,E,E],
    [E,A,A,E,E,E,E,A,A,E,E,E],
  ],

  // 恶魔 — 双角、尖尾、翅膀
  demon: [
    [E,A,E,E,E,E,E,E,A,E,E,E],
    [E,E,A,H,H,H,H,A,E,E,E,E],
    [E,E,H,H,H,H,H,H,E,E,E,E],
    [E,E,H,S,X,S,X,H,E,E,E,E],
    [E,E,E,S,S,S,S,E,E,E,E,E],
    [F,F,P,P,P,P,P,P,F,F,E,E],
    [E,F,P,P,P,A,P,P,F,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,E,P,P,E,P,E,E,E,E,E],
    [E,E,E,P,E,E,P,E,A,E,E,E],
    [E,E,E,A,E,E,A,E,A,E,E,E],
    [E,E,E,A,E,E,A,E,E,A,E,E],
  ],

  // 天使 — 光环、光翼
  angel: [
    [E,E,E,A,A,A,A,E,E,E,E,E],
    [E,E,E,E,H,H,E,E,E,E,E,E],
    [E,E,E,H,H,H,H,E,E,E,E,E],
    [E,E,E,H,S,X,S,E,E,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,F,F,P,P,P,P,F,F,E,E,E],
    [F,F,E,P,P,A,P,E,F,F,E,E],
    [F,E,E,P,P,P,P,E,E,F,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,E,E,E,A,A,E,E,E,E,E,E],
  ],

  // 忍者 — 面罩仅露眼、手里剑
  ninja: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,P,X,P,P,X,P,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,S,P,P,A,P,S,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,E,E,P,E,P,E,E,W,E,E],
    [E,E,E,E,P,E,P,E,W,A,W,E],
    [E,E,E,E,A,E,A,E,E,W,E,E],
    [E,E,E,E,A,E,A,E,E,E,E,E],
  ],

  // 国王/皇帝 — 王冠、披风、权杖
  king: [
    [E,E,E,A,E,A,E,A,E,E,E,E],
    [E,E,E,A,A,A,A,A,E,E,E,E],
    [E,E,E,H,H,H,H,H,E,E,E,E],
    [E,E,E,S,S,X,S,S,E,E,E,E],
    [E,E,E,E,S,S,S,E,E,E,E,E],
    [E,F,P,P,P,P,P,P,F,E,E,E],
    [E,F,P,P,P,A,P,P,F,E,E,E],
    [E,F,E,P,P,P,P,E,F,E,E,E],
    [E,E,E,E,P,E,P,E,E,W,E,E],
    [E,E,E,E,P,E,P,E,E,W,E,E],
    [E,E,E,E,A,E,A,E,E,W,E,E],
    [E,E,E,E,A,E,A,E,E,A,E,E],
  ],

  // 骷髅/亡灵 — 骨骼轮廓
  skeleton: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,P,X,P,P,X,P,E,E,E,E],
    [E,E,E,P,E,E,P,E,E,E,E,E],
    [E,E,E,P,A,A,P,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,P,E,E,P,E,E,E,E,E],
    [E,E,E,P,E,E,P,E,E,E,E,E],
  ],

  // 巨人/泰坦 — 占满画布的大块头
  giant: [
    [E,E,E,H,H,H,H,E,E,E,E,E],
    [E,E,H,H,H,H,H,H,E,E,E,E],
    [E,H,H,S,X,S,X,H,H,E,E,E],
    [E,E,E,S,S,S,S,S,E,E,E,E],
    [P,P,P,P,P,P,P,P,P,P,E,E],
    [P,P,S,P,P,A,P,P,S,P,E,E],
    [E,P,E,P,P,A,P,P,E,P,E,E],
    [E,E,E,P,P,P,P,P,E,E,E,E],
    [E,E,P,P,P,E,P,P,P,E,E,E],
    [E,E,P,P,E,E,E,P,P,E,E,E],
    [E,P,P,A,E,E,E,A,P,P,E,E],
    [E,P,A,A,E,E,E,A,A,P,E,E],
  ],

  // 鱼/水生 — 流线型、鳍
  fish: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,E,E,E,E,F,E,E,E,E],
    [E,E,E,E,E,P,F,E,E,E,E,E],
    [E,E,E,E,P,P,P,P,E,E,E,E],
    [E,F,E,P,P,P,P,P,P,E,E,E],
    [F,F,P,P,X,P,P,P,P,P,E,E],
    [F,F,P,P,P,P,P,A,P,P,E,E],
    [E,F,E,P,P,P,P,P,P,E,E,E],
    [E,E,E,E,P,P,P,P,E,E,E,E],
    [E,E,E,E,E,P,F,E,E,E,E,E],
    [E,E,E,E,E,E,E,F,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 蛇/长虫 — S型蜿蜒身体
  serpent: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,P,P,P,E,E,E,E,E,E,E,E],
    [P,X,P,X,P,E,E,E,E,E,E,E],
    [E,P,A,P,E,E,E,E,E,E,E,E],
    [E,E,P,P,P,E,E,E,E,E,E,E],
    [E,E,E,P,P,P,E,E,E,E,E,E],
    [E,E,E,E,P,P,P,E,E,E,E,E],
    [E,E,E,P,P,P,E,E,E,E,E,E],
    [E,E,P,P,P,E,E,E,E,E,E,E],
    [E,E,P,P,E,E,E,E,E,E,E,E],
    [E,E,E,P,P,E,E,E,E,E,E,E],
    [E,E,E,E,A,E,E,E,E,E,E,E],
  ],

  // 南瓜/蔬果类 — 圆形物件
  pumpkin: [
    [E,E,E,E,F,F,E,E,E,E,E,E],
    [E,E,E,E,F,E,E,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,P,P,P,P,P,P,P,P,E,E,E],
    [E,P,P,X,P,P,X,P,P,E,E,E],
    [E,P,P,P,P,P,P,P,P,E,E,E],
    [E,P,P,A,A,A,A,P,P,E,E,E],
    [E,E,P,P,P,P,P,P,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,E,E,A,A,E,E,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 元素（火/冰/雷等） — 抽象能量体
  elemental: [
    [E,E,E,E,F,E,E,E,E,E,E,E],
    [E,E,E,F,A,F,E,E,E,E,E,E],
    [E,E,F,A,P,A,F,E,E,E,E,E],
    [E,E,A,P,P,P,A,E,E,E,E,E],
    [E,F,P,P,X,P,P,F,E,E,E,E],
    [E,A,P,P,P,P,P,A,E,E,E,E],
    [E,F,P,P,X,P,P,F,E,E,E,E],
    [E,E,A,P,P,P,A,E,E,E,E,E],
    [E,E,F,A,P,A,F,E,E,E,E,E],
    [E,E,E,F,A,F,E,E,E,E,E,E],
    [E,E,E,E,F,E,E,E,E,E,E,E],
    [E,E,E,E,E,E,E,E,E,E,E,E],
  ],

  // 武僧/格斗家 — 光头、拳套、格斗站姿
  monk: [
    [E,E,E,E,E,E,E,E,E,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,E,E,S,S,S,S,E,E,E,E,E],
    [E,E,E,S,X,S,X,E,E,E,E,E],
    [E,E,E,E,S,S,E,E,E,E,E,E],
    [E,E,E,P,P,P,P,E,E,E,E,E],
    [E,E,A,S,P,P,S,A,E,E,E,E],
    [E,A,E,E,P,A,E,E,A,E,E,E],
    [E,E,E,E,P,P,E,E,E,E,E,E],
    [E,E,E,P,P,E,P,E,E,E,E,E],
    [E,E,E,P,E,E,E,P,E,E,E,E],
    [E,E,A,A,E,E,A,A,E,E,E,E],
  ],
};

/* ===================================================================
   模块化叠加层 — 在基础模板上叠加装饰像素
   覆盖格式: [row, col, pixelType]
   =================================================================== */

const HAT_OVERLAYS: Record<string, [number, number, number][]> = {
  crown: [
    [0,3,A],[0,4,E],[0,5,A],[0,6,E],[0,7,A],
    [1,3,A],[1,4,A],[1,5,A],[1,6,A],[1,7,A],
  ],
  horn: [
    [0,3,A],[0,7,A],[1,3,A],[1,7,A],
  ],
  halo: [
    [0,3,A],[0,4,A],[0,5,A],[0,6,A],
  ],
};

const WING_OVERLAYS: Record<string, [number, number, number][]> = {
  angel: [
    [4,0,F],[4,1,F],[4,9,F],[4,10,F],
    [5,0,F],[5,10,F],
    [6,0,F],[6,10,F],
  ],
  demon: [
    [3,0,F],[3,10,F],
    [4,0,F],[4,1,F],[4,9,F],[4,10,F],
    [5,0,F],[5,10,F],
  ],
  tiny: [
    [5,0,F],[5,10,F],
    [6,0,F],[6,10,F],
  ],
};

const HELD_OVERLAYS: Record<string, [number, number, number][]> = {
  sword: [
    [4,10,W],[5,10,W],[6,10,W],[7,10,W],[8,10,W],
  ],
  staff: [
    [2,10,A],[3,10,W],[4,10,W],[5,10,W],[6,10,W],[7,10,W],[8,10,W],[9,10,W],
  ],
  shield: [
    [5,0,W],[5,1,W],[6,0,W],[6,1,W],[7,0,W],[7,1,W],
  ],
  bow: [
    [3,10,W],[4,10,W],[4,11,W],[5,11,W],[6,11,W],[7,10,W],[7,11,W],[8,10,W],
  ],
  dual: [
    [6,0,W],[7,0,W],[6,10,W],[7,10,W],
  ],
};

const AURA_OVERLAYS: Record<string, [number, number, number][]> = {
  fire: [[10,1,F],[10,9,F],[11,0,F],[11,2,F],[11,8,F],[11,10,F]],
  ice: [[0,1,F],[0,9,F],[1,0,F],[1,10,F]],
  dark: [[0,0,F],[0,10,F],[11,0,F],[11,10,F],[6,0,F],[6,10,F]],
  holy: [[0,2,F],[0,8,F],[1,1,F],[1,9,F],[11,3,F],[11,7,F]],
};

/* ===================================================================
   配色 — 与原型关联的专属色系 + 通用fallback
   =================================================================== */

type Palette = {
  primary: string;
  accent: string;
  hair: string;
  skin: string;
  eye: string;
  weapon: string;
  special: string; // F 类型的颜色
};

// 原型专属配色：每个原型有 2-3 套配色方案
const ARCHETYPE_PALETTES: Record<string, Palette[]> = {
  vampire: [
    { primary: "#2c0033", accent: "#8B0000", hair: "#1a1a2e", skin: "#e0d0c0", eye: "#ff0000", weapon: "#a0a0a0", special: "#4a0020" },
    { primary: "#1a0a2e", accent: "#6a0dad", hair: "#f5f5f5", skin: "#d4c5b0", eye: "#ff3333", weapon: "#c0c0c0", special: "#2d0050" },
  ],
  dragon: [
    { primary: "#8B0000", accent: "#ff4500", hair: "#ffd700", skin: "#cc4400", eye: "#ffff00", weapon: "#a0a0a0", special: "#ff6600" },
    { primary: "#006400", accent: "#00cc00", hair: "#90ee90", skin: "#228B22", eye: "#ffff00", weapon: "#808080", special: "#00ff00" },
    { primary: "#191970", accent: "#4169e1", hair: "#87ceeb", skin: "#4682b4", eye: "#00ffff", weapon: "#c0c0c0", special: "#1e90ff" },
  ],
  baby: [
    { primary: "#ffb6c1", accent: "#ff69b4", hair: "#deb887", skin: "#ffe4c4", eye: "#000000", weapon: "#dda0dd", special: "#ffb6c1" },
    { primary: "#87ceeb", accent: "#4682b4", hair: "#f5deb3", skin: "#ffdab9", eye: "#000000", weapon: "#b0c4de", special: "#add8e6" },
  ],
  robot: [
    { primary: "#708090", accent: "#00ccff", hair: "#c0c0c0", skin: "#a9a9a9", eye: "#00ff00", weapon: "#808080", special: "#00ccff" },
    { primary: "#b22222", accent: "#ff4444", hair: "#666", skin: "#999", eye: "#ffff00", weapon: "#555", special: "#ff2222" },
  ],
  ghost: [
    { primary: "#b0c4de", accent: "#e6e6fa", hair: "#dcdcdc", skin: "#f0f0f0", eye: "#4444ff", weapon: "#c0c0c0", special: "#e0e0ff" },
    { primary: "#6a5acd", accent: "#9370db", hair: "#e6e6fa", skin: "#ddd0ff", eye: "#ff00ff", weapon: "#b0b0b0", special: "#8A2BE2" },
  ],
  slime: [
    { primary: "#00cc44", accent: "#88ff88", hair: "#00cc44", skin: "#00cc44", eye: "#ffffff", weapon: "#00cc44", special: "#00ff00" },
    { primary: "#4444ff", accent: "#8888ff", hair: "#4444ff", skin: "#4444ff", eye: "#ffffff", weapon: "#4444ff", special: "#6666ff" },
    { primary: "#ff4444", accent: "#ff8888", hair: "#ff4444", skin: "#ff4444", eye: "#ffffff", weapon: "#ff4444", special: "#ff6666" },
  ],
  fairy: [
    { primary: "#dda0dd", accent: "#ff69b4", hair: "#ffec8b", skin: "#ffe4c4", eye: "#00ffff", weapon: "#da70d6", special: "#ff69b4" },
    { primary: "#98fb98", accent: "#00fa9a", hair: "#7cfc00", skin: "#f0fff0", eye: "#00ff00", weapon: "#90ee90", special: "#00ff7f" },
  ],
  demon: [
    { primary: "#8B0000", accent: "#ff0000", hair: "#1a1a1a", skin: "#cc3333", eye: "#ffff00", weapon: "#555", special: "#ff4500" },
    { primary: "#4b0082", accent: "#9400d3", hair: "#000", skin: "#8b4513", eye: "#ff00ff", weapon: "#666", special: "#9932cc" },
  ],
  angel: [
    { primary: "#f0f0ff", accent: "#ffd700", hair: "#ffe4b5", skin: "#ffe4c4", eye: "#87ceeb", weapon: "#ffd700", special: "#fffacd" },
    { primary: "#e6e6fa", accent: "#da70d6", hair: "#fff8dc", skin: "#ffefd5", eye: "#b0e0e6", weapon: "#dda0dd", special: "#fff0f5" },
  ],
  skeleton: [
    { primary: "#f5f5dc", accent: "#d2b48c", hair: "#f5f5dc", skin: "#f5f5dc", eye: "#ff0000", weapon: "#808080", special: "#dcdcdc" },
  ],
  insect: [
    { primary: "#556b2f", accent: "#8b4513", hair: "#2f4f4f", skin: "#6b8e23", eye: "#ff0000", weapon: "#808080", special: "#9acd32" },
    { primary: "#000", accent: "#ffd700", hair: "#000", skin: "#333", eye: "#ff4444", weapon: "#555", special: "#ffcc00" },
  ],
  plant: [
    { primary: "#8b4513", accent: "#a0522d", hair: "#228B22", skin: "#8b4513", eye: "#ffff00", weapon: "#6b8e23", special: "#00cc00" },
    { primary: "#deb887", accent: "#f5deb3", hair: "#ff69b4", skin: "#deb887", eye: "#ff1493", weapon: "#90ee90", special: "#ff69b4" },
  ],
  ninja: [
    { primary: "#1a1a2e", accent: "#e94560", hair: "#1a1a2e", skin: "#d4a574", eye: "#fff", weapon: "#c0c0c0", special: "#0f3460" },
  ],
  elemental: [
    { primary: "#ff4500", accent: "#ffd700", hair: "#ff6347", skin: "#ff4500", eye: "#fff", weapon: "#ff8c00", special: "#ff0000" },
    { primary: "#4169e1", accent: "#00ffff", hair: "#87ceeb", skin: "#4682b4", eye: "#fff", weapon: "#1e90ff", special: "#00bfff" },
    { primary: "#9400d3", accent: "#ff00ff", hair: "#da70d6", skin: "#9370db", eye: "#fff", weapon: "#ba55d3", special: "#ee82ee" },
  ],
  fish: [
    { primary: "#4682b4", accent: "#00bfff", hair: "#4682b4", skin: "#87ceeb", eye: "#000", weapon: "#4682b4", special: "#1e90ff" },
    { primary: "#ff6347", accent: "#ffa07a", hair: "#ff6347", skin: "#ffa500", eye: "#000", weapon: "#ff6347", special: "#ff4500" },
  ],
  serpent: [
    { primary: "#228B22", accent: "#32cd32", hair: "#006400", skin: "#228B22", eye: "#ffff00", weapon: "#228B22", special: "#00ff00" },
    { primary: "#8b008b", accent: "#ff00ff", hair: "#4b0082", skin: "#9932cc", eye: "#ff0", weapon: "#9932cc", special: "#da70d6" },
  ],
  pumpkin: [
    { primary: "#ff8c00", accent: "#ffd700", hair: "#ff8c00", skin: "#ff8c00", eye: "#ffff00", weapon: "#ff8c00", special: "#228B22" },
  ],
  rider: [
    { primary: "#c0392b", accent: "#e74c3c", hair: "#5D4037", skin: "#DEB887", eye: "#fff", weapon: "#a0a0a0", special: "#8b4513" },
    { primary: "#2471a3", accent: "#5dade2", hair: "#212121", skin: "#F0D5AE", eye: "#fff", weapon: "#c0c0c0", special: "#696969" },
  ],
  giant: [
    { primary: "#8b4513", accent: "#a0522d", hair: "#696969", skin: "#d2b48c", eye: "#ff0", weapon: "#808080", special: "#8b4513" },
  ],
  beast: [
    { primary: "#d2691e", accent: "#cd853f", hair: "#8b4513", skin: "#deb887", eye: "#000", weapon: "#d2691e", special: "#f4a460" },
    { primary: "#696969", accent: "#a9a9a9", hair: "#333", skin: "#808080", eye: "#00ff00", weapon: "#696969", special: "#555" },
  ],
  bird: [
    { primary: "#ff4500", accent: "#ffd700", hair: "#ff6347", skin: "#ff8c00", eye: "#000", weapon: "#ff4500", special: "#ff0000" },
    { primary: "#4169e1", accent: "#87ceeb", hair: "#191970", skin: "#4682b4", eye: "#fff", weapon: "#4169e1", special: "#1e90ff" },
  ],
  monk: [
    { primary: "#ff8c00", accent: "#ffd700", hair: "#d2b48c", skin: "#deb887", eye: "#000", weapon: "#ff8c00", special: "#ff8c00" },
  ],
};

// 通用 fallback 配色
const GENERIC_PALETTES: Palette[] = [
  { primary: "#c0392b", accent: "#e74c3c", hair: "#5D4037", skin: "#DEB887", eye: "#fff", weapon: "#a0a0a0", special: "#e74c3c" },
  { primary: "#2471a3", accent: "#5dade2", hair: "#212121", skin: "#F0D5AE", eye: "#fff", weapon: "#c0c0c0", special: "#5dade2" },
  { primary: "#1e8449", accent: "#52be80", hair: "#922b21", skin: "#D4A574", eye: "#fff", weapon: "#8B7355", special: "#52be80" },
  { primary: "#7d3c98", accent: "#af7ac5", hair: "#ecf0f1", skin: "#C8A882", eye: "#d0d0ff", weapon: "#9B59B6", special: "#af7ac5" },
  { primary: "#ca6f1e", accent: "#f0b27a", hair: "#1a237e", skin: "#DEB887", eye: "#fff", weapon: "#8B4513", special: "#f0b27a" },
  { primary: "#2c3e50", accent: "#5d6d7e", hair: "#ff6f00", skin: "#C8A882", eye: "#ff4444", weapon: "#607d8b", special: "#5d6d7e" },
  { primary: "#b7950b", accent: "#f4d03f", hair: "#4a148c", skin: "#D4A574", eye: "#fff", weapon: "#ffd700", special: "#f4d03f" },
  { primary: "#b03a7a", accent: "#e91e63", hair: "#ffd600", skin: "#DEB887", eye: "#fff", weapon: "#ff69b4", special: "#e91e63" },
];

/* ===================================================================
   关键词 → 原型推断（用于没有 visual 字段的老角色）
   =================================================================== */

const KEYWORD_TO_ARCHETYPE: [RegExp, string][] = [
  // 具体生物/角色
  [/龙|dragon|恐龙|蜥蜴|蛟/i, "dragon"],
  [/吸血鬼|vampire|血族|伯爵|德古拉/i, "vampire"],
  [/婴儿|宝宝|幼儿|奶瓶|奶嘴|尿布|新生/i, "baby"],
  [/机器人|robot|机甲|赛博|android|AI|人工智能/i, "robot"],
  [/精灵|仙女|fairy|妖精|小仙|花仙|蝴蝶/i, "fairy"],
  [/幽灵|ghost|灵魂|亡魂|鬼|幽魂|幽影/i, "ghost"],
  [/史莱姆|slime|软体|果冻|黏液|胶状/i, "slime"],
  [/骑士.*龙|龙骑|骑.*马|骑士.*坐骑|rider|骑兵|骑手/i, "rider"],
  [/蚂蚁|蚊子|苍蝇|蜜蜂|虫|蝎|蜘蛛|蟑螂|甲虫|螳螂|蝗|insect|bug/i, "insect"],
  [/猫|狗|狼|虎|豹|熊|狮|兔|鹿|fox|wolf|tiger|lion|bear/i, "beast"],
  [/鸟|鹰|凤凰|雀|鸦|鸡|鸭|鹅|鹤|swan|eagle|phoenix/i, "bird"],
  [/树人|植物|花|草|藤|蘑菇|plant|tree|flower/i, "plant"],
  [/恶魔|demon|devil|魔鬼|撒旦|地狱/i, "demon"],
  [/天使|angel|神使|天神|圣光/i, "angel"],
  [/忍者|ninja|暗杀|刺客|影|隐/i, "ninja"],
  [/国王|king|queen|皇帝|女王|帝王|君主|emperor/i, "king"],
  [/骷髅|skeleton|亡灵|undead|僵尸|丧尸|zombie/i, "skeleton"],
  [/泰坦|巨人|giant|titan|巨大|庞然/i, "giant"],
  [/鱼|fish|鲨|鲸|海豚|水母|章鱼|海/i, "fish"],
  [/蛇|snake|serpent|蟒|眼镜蛇|毒蛇/i, "serpent"],
  [/南瓜|pumpkin|万圣|果实|西瓜|苹果|橘子|蔬菜|水果/i, "pumpkin"],
  [/火|冰|雷|lightning|风|水|元素|elemental|岩|电/i, "elemental"],
  [/武僧|monk|格斗|拳|少林|空手道|跆拳道/i, "monk"],
  // 宽泛匹配
  [/法师|mage|wizard|魔法|巫师|术士|魔导/i, "mage"],
  [/盗贼|rogue|thief|小偷|侠盗|暗影/i, "rogue"],
  [/坦克|tank|重甲|盾|守护|护卫|防御/i, "tank"],
  [/战士|fighter|warrior|剑|sword|勇士|骑士/i, "warrior"],
];

/** 从关键词和描述推断原型 */
function inferArchetype(keywords?: string, description?: string, stats?: { str: number; dex: number; con: number; int_val: number; wis: number }): string {
  const text = `${keywords || ""} ${description || ""}`.toLowerCase();

  for (const [pattern, archetype] of KEYWORD_TO_ARCHETYPE) {
    if (pattern.test(text)) return archetype;
  }

  // fallback: 用属性推断基础职业
  if (stats) {
    const { str, dex, con, int_val, wis } = stats;
    const vals = [
      { key: "warrior", val: str },
      { key: "rogue", val: dex },
      { key: "tank", val: con },
      { key: "mage", val: Math.max(int_val, wis) },
    ];
    vals.sort((a, b) => b.val - a.val);
    return vals[0].key;
  }

  return "warrior";
}

/** 从关键词推断叠加层修饰 */
function inferModifiers(keywords?: string, description?: string): Partial<VisualConfig> {
  const text = `${keywords || ""} ${description || ""}`.toLowerCase();
  const mods: Partial<VisualConfig> = {};

  if (/王冠|crown|king|queen|皇|帝/.test(text)) mods.hat = "crown";
  else if (/角|horn|犄角|鹿角/.test(text)) mods.hat = "horn";
  else if (/光环|halo|神圣|圣/.test(text)) mods.hat = "halo";

  if (/天使|angel|羽翼|白翼/.test(text)) mods.wings = "angel";
  else if (/恶魔|demon|蝙蝠翼|暗翼/.test(text)) mods.wings = "demon";
  else if (/翅膀|翼|wing|飞/.test(text)) mods.wings = "tiny";

  if (/剑|sword|刀|blade/.test(text)) mods.held = "sword";
  else if (/法杖|staff|魔杖|权杖/.test(text)) mods.held = "staff";
  else if (/盾|shield/.test(text)) mods.held = "shield";
  else if (/弓|bow|箭/.test(text)) mods.held = "bow";
  else if (/双|dual|双刀|双剑/.test(text)) mods.held = "dual";

  if (/火|flame|fire|烈焰|炎/.test(text)) mods.aura = "fire";
  else if (/冰|ice|frost|frozen|霜/.test(text)) mods.aura = "ice";
  else if (/暗|dark|shadow|影|黑暗/.test(text)) mods.aura = "dark";
  else if (/圣|holy|光|divine|神圣/.test(text)) mods.aura = "holy";

  return mods;
}

/* ===================================================================
   确定性哈希
   =================================================================== */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ===================================================================
   渲染函数
   =================================================================== */

function buildGrid(archetype: string, modifiers: Partial<VisualConfig>): number[][] {
  const template = ARCHETYPES[archetype] || ARCHETYPES.warrior;
  // 深拷贝 12×12 模板
  const grid = template.map(row => [...row]);
  // 扩展到 12 列（有些叠加层可能超出）
  const totalCols = 12;
  grid.forEach(row => { while (row.length < totalCols) row.push(E); });

  // 应用叠加层（只在空白格上写入，不覆盖已有像素）
  const applyOverlay = (overlay?: [number, number, number][]) => {
    if (!overlay) return;
    for (const [r, c, t] of overlay) {
      if (r >= 0 && r < grid.length && c >= 0 && c < totalCols) {
        if (grid[r][c] === E) grid[r][c] = t;
      }
    }
  };

  if (modifiers.hat) applyOverlay(HAT_OVERLAYS[modifiers.hat]);
  if (modifiers.wings) applyOverlay(WING_OVERLAYS[modifiers.wings]);
  if (modifiers.held) applyOverlay(HELD_OVERLAYS[modifiers.held]);
  if (modifiers.aura) applyOverlay(AURA_OVERLAYS[modifiers.aura]);

  return grid;
}

function choosePalette(archetype: string, h: number): Palette {
  const archetypePals = ARCHETYPE_PALETTES[archetype];
  if (archetypePals && archetypePals.length > 0) {
    return archetypePals[h % archetypePals.length];
  }
  return GENERIC_PALETTES[h % GENERIC_PALETTES.length];
}

/* ===================================================================
   导出组件
   =================================================================== */

export function PixelAvatar({
  character,
  size = 6,
  flip = false,
  className = "",
}: PixelAvatarProps) {
  const { grid, colors, cols } = useMemo(() => {
    const h = hash(character.id || character.name);

    // 确定原型和修饰
    let archetype: string;
    let modifiers: Partial<VisualConfig>;

    if (character.visual?.archetype && ARCHETYPES[character.visual.archetype]) {
      // 新角色：用 visual 字段
      archetype = character.visual.archetype;
      modifiers = {
        hat: character.visual.hat,
        wings: character.visual.wings,
        held: character.visual.held,
        aura: character.visual.aura,
      };
    } else {
      // 老角色：从关键词/描述推断
      archetype = inferArchetype(character.keywords, character.description, character);
      modifiers = inferModifiers(character.keywords, character.description);
    }

    const grid = buildGrid(archetype, modifiers);
    const pal = choosePalette(archetype, h);

    const colors: Record<number, string> = {
      [S]: pal.skin,
      [P]: pal.primary,
      [A]: pal.accent,
      [X]: pal.eye,
      [H]: pal.hair,
      [W]: pal.weapon,
      [F]: pal.special,
    };

    const cols = grid[0]?.length || 12;
    return { grid, colors, cols };
  }, [character]);

  return (
    <div
      className={className}
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridTemplateRows: `repeat(${grid.length}, ${size}px)`,
        transform: flip ? "scaleX(-1)" : undefined,
        imageRendering: "pixelated",
      }}
    >
      {grid.flat().map((cell, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            backgroundColor: cell === E ? "transparent" : (colors[cell] || "transparent"),
          }}
        />
      ))}
    </div>
  );
}
