"use client";

import { useMemo } from "react";

// 像素类型索引
const E = 0; // 空
const S = 1; // 皮肤
const P = 2; // 主色（服装）
const A = 3; // 强调色
const X = 4; // 眼睛
const H = 5; // 头发
const W = 6; // 武器

interface PixelAvatarProps {
  character: {
    id?: string;
    name: string;
    str: number;
    dex: number;
    con: number;
    int_val: number;
    wis: number;
    cha: number;
    weapons?: { type: string }[];
  };
  size?: number;
  flip?: boolean;
  className?: string;
}

// --- 半模板（左5列，镜像扩展为9列宽） ---
// 每模板 12 行 × 5 列

const FIGHTER_HALF = [
  [E, E, H, H, H],
  [E, H, H, H, H],
  [E, H, S, X, S],
  [E, E, S, S, S],
  [E, P, P, P, P],
  [E, S, P, A, P],
  [E, E, P, A, P],
  [E, E, P, P, E],
  [E, E, P, E, E],
  [E, E, P, E, E],
  [E, E, A, E, E],
  [E, A, A, E, E],
];

const MAGE_HALF = [
  [E, E, A, A, A],
  [E, E, A, H, H],
  [E, E, H, X, S],
  [E, E, S, S, S],
  [E, P, P, P, P],
  [E, E, P, A, P],
  [E, E, P, P, P],
  [E, E, P, P, E],
  [E, P, P, E, E],
  [E, P, P, E, E],
  [P, P, A, E, E],
  [P, P, E, E, E],
];

const ROGUE_HALF = [
  [E, E, A, A, A],
  [E, A, A, H, H],
  [E, A, S, X, S],
  [E, E, S, S, S],
  [E, E, P, P, P],
  [E, S, P, A, P],
  [E, E, P, P, P],
  [E, E, P, A, E],
  [E, E, P, E, E],
  [E, E, P, E, E],
  [E, E, A, E, E],
  [E, E, A, E, E],
];

const TANK_HALF = [
  [E, E, H, H, H],
  [E, H, H, H, H],
  [E, H, S, X, S],
  [E, E, S, S, S],
  [P, P, P, P, P],
  [P, S, P, A, P],
  [P, E, P, A, P],
  [E, E, P, P, P],
  [E, P, P, E, P],
  [E, P, P, E, P],
  [E, A, A, E, A],
  [A, A, A, E, A],
];

const TEMPLATES: Record<string, number[][]> = {
  fighter: FIGHTER_HALF,
  mage: MAGE_HALF,
  rogue: ROGUE_HALF,
  tank: TANK_HALF,
};

// 武器覆盖层 (在角色右侧添加武器像素)
// 格式: [row, colOffset, type] — colOffset 相对于9列网格右侧
const WEAPON_OVERLAYS: Record<string, [number, number, number][]> = {
  fighter: [
    [4, 9, W], [5, 9, W], [5, 10, W], [6, 10, W], [7, 10, W], [8, 10, W],
  ],
  mage: [
    [3, 9, W], [4, 9, W], [5, 9, W], [6, 9, W], [7, 9, W], [8, 9, W], [9, 9, W], [2, 9, A],
  ],
  rogue: [
    [5, 9, W], [6, 9, W], [6, 10, W], [7, 10, W],
  ],
  tank: [
    [4, 9, W], [5, 9, W], [5, 10, W], [6, 9, W], [6, 10, W], [7, 9, W],
  ],
};

// 左5列镜像为完整9列: [c0,c1,c2,c3,c4] → [c0,c1,c2,c3,c4,c3,c2,c1,c0]
function expandHalf(half: number[][]): number[][] {
  return half.map((row) => [...row, ...row.slice(0, 4).reverse()]);
}

// 添加武器像素到网格 (扩展宽度到11列)
function addWeapon(grid: number[][], templateName: string): number[][] {
  const overlay = WEAPON_OVERLAYS[templateName];
  if (!overlay) return grid;

  const totalCols = 11;
  const expanded = grid.map((row) => {
    const newRow = [...row];
    while (newRow.length < totalCols) newRow.push(E);
    return newRow;
  });

  for (const [row, col, type] of overlay) {
    if (row < expanded.length && col < totalCols) {
      expanded[row][col] = type;
    }
  }
  return expanded;
}

// 确定性哈希
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 像素风配色方案
const PALETTES = [
  { primary: "#c0392b", accent: "#e74c3c", hair: "#5D4037", skin: "#DEB887", eye: "#fff", weapon: "#a0a0a0" },
  { primary: "#2471a3", accent: "#5dade2", hair: "#212121", skin: "#F0D5AE", eye: "#fff", weapon: "#c0c0c0" },
  { primary: "#1e8449", accent: "#52be80", hair: "#922b21", skin: "#D4A574", eye: "#fff", weapon: "#8B7355" },
  { primary: "#7d3c98", accent: "#af7ac5", hair: "#ecf0f1", skin: "#C8A882", eye: "#d0d0ff", weapon: "#9B59B6" },
  { primary: "#ca6f1e", accent: "#f0b27a", hair: "#1a237e", skin: "#DEB887", eye: "#fff", weapon: "#8B4513" },
  { primary: "#148f77", accent: "#45b39d", hair: "#e65100", skin: "#F0D5AE", eye: "#b9f6ca", weapon: "#2ecc71" },
  { primary: "#b7950b", accent: "#f4d03f", hair: "#4a148c", skin: "#D4A574", eye: "#fff", weapon: "#ffd700" },
  { primary: "#b03a7a", accent: "#e91e63", hair: "#ffd600", skin: "#DEB887", eye: "#fff", weapon: "#ff69b4" },
  { primary: "#2c3e50", accent: "#5d6d7e", hair: "#ff6f00", skin: "#C8A882", eye: "#ff4444", weapon: "#607d8b" },
  { primary: "#1a5276", accent: "#2e86c1", hair: "#f1c40f", skin: "#F0D5AE", eye: "#fff", weapon: "#3498db" },
];

// 根据属性选择体型
function chooseTemplate(stats: PixelAvatarProps["character"]): string {
  const { str, dex, con, int_val, wis } = stats;
  const vals = [
    { key: "fighter", val: str },
    { key: "rogue", val: dex },
    { key: "tank", val: con },
    { key: "mage", val: Math.max(int_val, wis) },
  ];
  vals.sort((a, b) => b.val - a.val);
  // 最高属性决定体型，平局时按优先级 fighter > mage > rogue > tank
  return vals[0].key;
}

export function PixelAvatar({
  character,
  size = 6,
  flip = false,
  className = "",
}: PixelAvatarProps) {
  const { grid, colors, cols } = useMemo(() => {
    const h = hash(character.id || character.name);
    const templateName = chooseTemplate(character);
    const baseGrid = expandHalf(TEMPLATES[templateName]);
    const grid = addWeapon(baseGrid, templateName);
    const pal = PALETTES[h % PALETTES.length];

    const colors: Record<number, string> = {
      [S]: pal.skin,
      [P]: pal.primary,
      [A]: pal.accent,
      [X]: pal.eye,
      [H]: pal.hair,
      [W]: pal.weapon,
    };
    const cols = grid[0]?.length || 11;
    return { grid, colors, cols };
  }, [character.id, character.name, character.str, character.dex, character.con, character.int_val, character.wis, character.cha]);

  return (
    <div
      className={className}
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridTemplateRows: `repeat(${grid.length}, ${size}px)`,
        transform: flip ? "scaleX(-1)" : undefined,
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
