// 角色生成类型定义

export interface CharacterStats {
  str: number;
  dex: number;
  con: number;
  int_val: number;
  wis: number;
  cha: number;
}

export interface Weapon {
  name: string;
  type: string;
  attack: number;
  effect: string;
}

export interface Armor {
  name: string;
  type: string;
  defense: number;
  effect: string;
}

export interface Skill {
  name: string;
  source: string;
  damage: number;
  effect: string;
  cooldown: number;
}

export interface SpecialItem {
  name: string;
  description: string;
  effect: string;
  power: number;
}

export interface Character {
  id: string;
  user_id: string | null;
  name: string;
  keywords: string;
  description: string;
  str: number;
  dex: number;
  con: number;
  int_val: number;
  wis: number;
  cha: number;
  max_hp: number;
  weapons: Weapon[];
  armors: Armor[];
  skills: Skill[];
  items: SpecialItem[];
  is_system: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface DailyLimit {
  id: string;
  user_id: string;
  date: string;
  generations: number;
  battles: number;
}
