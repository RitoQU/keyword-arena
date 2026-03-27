import type { Character, BattleAction, BattleResult, Weapon, Skill, SpecialItem } from "./types";

const MAX_ROUNDS = 10;
/** HP 公式参数 */
const HP_MULTIPLIER = 11;
const HP_BASE = 40;
/** 伤害上限：单次攻击最多造成目标最大 HP 的 35% */
const DAMAGE_CAP_PCT = 0.35;
/** 伤害波动幅度：±25% */
const DAMAGE_VARIANCE = 0.25;
/** 弱者增伤系数：属性总和差距越大，弱方伤害加成越高 */
const UNDERDOG_MULTIPLIER = 3.5;

/** 根据 CON 重算 max_hp（确保始终使用最新公式） */
function calcMaxHp(char: Character): number {
  return char.con * HP_MULTIPLIER + HP_BASE;
}

interface FighterState {
  char: Character;
  hp: number;
  maxHp: number;
  side: "player" | "opponent";
  skillCooldowns: Map<number, number>; // skillIndex -> remainingCooldown
  underdogBonus: number; // 弱者增伤倍数，>=1
}

/** 计算总防御力 */
function getTotalDefense(char: Character): number {
  return char.armors.reduce((sum, a) => sum + a.defense, 0);
}

/** 计算最佳武器攻击力 */
function getBestWeapon(char: Character): Weapon {
  return char.weapons.reduce((best, w) => (w.attack > best.attack ? w : best), char.weapons[0]);
}

/** 先手判定：DEX 高者先行动，相同则随机 */
function determineInitiative(a: FighterState, b: FighterState): [FighterState, FighterState] {
  if (a.char.dex > b.char.dex) return [a, b];
  if (b.char.dex > a.char.dex) return [b, a];
  return Math.random() < 0.5 ? [a, b] : [b, a];
}

/** 命中判定：80% + (攻方DEX - 守方DEX) × 2% */
function rollHit(attackerDex: number, defenderDex: number): boolean {
  const hitChance = 0.8 + (attackerDex - defenderDex) * 0.02;
  return Math.random() < Math.max(0.3, Math.min(0.95, hitChance));
}

/** 暴击判定：5% + WIS × 1% */
function rollCrit(wis: number): boolean {
  const critChance = 0.05 + wis * 0.01;
  return Math.random() < Math.min(0.4, critChance);
}

/** 选择可用技能（有冷却好的优先选伤害最高的） */
function pickAvailableSkill(char: Character, cooldowns: Map<number, number>): { skill: Skill; index: number } | null {
  let best: { skill: Skill; index: number } | null = null;
  for (let i = 0; i < char.skills.length; i++) {
    const cd = cooldowns.get(i) || 0;
    if (cd <= 0 && char.skills[i].damage > 0) {
      if (!best || char.skills[i].damage > best.skill.damage) {
        best = { skill: char.skills[i], index: i };
      }
    }
  }
  return best;
}

/** 特殊物品触发检查：每回合 15% + CHA × 1.5% 概率触发 */
function tryTriggerItem(char: Character): SpecialItem | null {
  for (const item of char.items) {
    const triggerChance = 0.15 + char.cha * 0.015;
    if (Math.random() < triggerChance && item.power > 0) {
      return item;
    }
  }
  return null;
}

/** 计算角色六维属性总和 */
function getTotalStats(char: Character): number {
  return char.str + char.dex + char.con + char.int_val + char.wis + char.cha;
}

/** 计算弱者增伤倍数：属性总和更低的一方获得伤害加成 */
function calcUnderdogBonus(attacker: Character, defender: Character): number {
  const ratio = getTotalStats(attacker) / getTotalStats(defender);
  if (ratio >= 1) return 1;
  return 1 + (1 - ratio) * UNDERDOG_MULTIPLIER;
}

/** 对伤害应用波动和上限 */
function applyDamageModifiers(baseDamage: number, underdogBonus: number, defenderMaxHp: number): number {
  let damage = baseDamage;
  // 伤害波动 ±25%
  const variance = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE;
  damage = Math.round(damage * variance);
  // 弱者增伤
  damage = Math.round(damage * underdogBonus);
  // 伤害上限
  damage = Math.min(damage, Math.round(defenderMaxHp * DAMAGE_CAP_PCT));
  return Math.max(1, damage);
}

/** 执行一次攻击行为 */
function executeAttack(
  attacker: FighterState,
  defender: FighterState,
  round: number
): BattleAction {
  // 决定使用技能还是普通攻击（60% 概率尝试技能）
  const useSkill = Math.random() < 0.6;
  const skill = useSkill ? pickAvailableSkill(attacker.char, attacker.skillCooldowns) : null;

  let damage: number;
  let actionType: BattleAction["actionType"];
  let actionName: string;
  let description: string;

  const isMiss = !rollHit(attacker.char.dex, defender.char.dex);
  const isCrit = !isMiss && rollCrit(attacker.char.wis);

  if (isMiss) {
    damage = 0;
    if (skill) {
      actionType = "skill";
      actionName = skill.skill.name;
      attacker.skillCooldowns.set(skill.index, skill.skill.cooldown);
      description = `${attacker.char.name} 释放「${skill.skill.name}」，但被 ${defender.char.name} 闪避了！`;
    } else {
      const weapon = getBestWeapon(attacker.char);
      actionType = "normal_attack";
      actionName = weapon ? weapon.name : "拳头";
      description = `${attacker.char.name} 挥动${actionName}攻击，但 ${defender.char.name} 敏捷地闪开了！`;
    }
  } else if (skill) {
    // 技能攻击
    actionType = "skill";
    actionName = skill.skill.name;
    const baseDmg = skill.skill.damage + attacker.char.int_val * 2.0 - defender.char.wis * 0.8;
    damage = Math.max(1, Math.round(baseDmg));
    if (isCrit) damage = Math.round(damage * 1.5);
    damage = applyDamageModifiers(damage, attacker.underdogBonus, defender.maxHp);
    attacker.skillCooldowns.set(skill.index, skill.skill.cooldown);
    description = isCrit
      ? `${attacker.char.name} 释放「${skill.skill.name}」——暴击！造成 ${damage} 点伤害！${skill.skill.effect}`
      : `${attacker.char.name} 释放「${skill.skill.name}」，造成 ${damage} 点伤害。${skill.skill.effect}`;
  } else {
    // 普通攻击
    const weapon = getBestWeapon(attacker.char);
    actionType = "normal_attack";
    actionName = weapon ? weapon.name : "拳头";
    const totalDef = getTotalDefense(defender.char);
    const baseDmg = (weapon ? weapon.attack : 5) + attacker.char.str * 1.5 - totalDef * 0.3 - defender.char.con * 0.5;
    damage = Math.max(1, Math.round(baseDmg));
    if (isCrit) damage = Math.round(damage * 1.5);
    damage = applyDamageModifiers(damage, attacker.underdogBonus, defender.maxHp);
    description = isCrit
      ? `${attacker.char.name} 用${actionName}发动猛攻——暴击！造成 ${damage} 点伤害！`
      : `${attacker.char.name} 用${actionName}攻击 ${defender.char.name}，造成 ${damage} 点伤害。`;
  }

  defender.hp = Math.max(0, defender.hp - damage);

  return {
    round,
    attacker: attacker.side,
    attackerName: attacker.char.name,
    defenderName: defender.char.name,
    actionType,
    actionName,
    damage,
    isCrit,
    isMiss,
    description,
    playerHp: attacker.side === "player" ? attacker.hp : defender.hp,
    opponentHp: attacker.side === "opponent" ? attacker.hp : defender.hp,
    playerMaxHp: attacker.side === "player" ? attacker.maxHp : defender.maxHp,
    opponentMaxHp: attacker.side === "opponent" ? attacker.maxHp : defender.maxHp,
  };
}

/** 执行特殊物品触发 */
function executeItemTrigger(
  owner: FighterState,
  target: FighterState,
  item: SpecialItem,
  round: number
): BattleAction {
  const baseDamage = Math.round(item.power * (1 + owner.char.cha * 0.1));
  const damage = applyDamageModifiers(baseDamage, owner.underdogBonus, target.maxHp);
  target.hp = Math.max(0, target.hp - damage);

  return {
    round,
    attacker: owner.side,
    attackerName: owner.char.name,
    defenderName: target.char.name,
    actionType: "item_trigger",
    actionName: item.name,
    damage,
    isCrit: false,
    isMiss: false,
    description: `${owner.char.name} 触发了「${item.name}」—— ${item.effect}，造成 ${damage} 点伤害！`,
    playerHp: owner.side === "player" ? owner.hp : target.hp,
    opponentHp: owner.side === "opponent" ? owner.hp : target.hp,
    playerMaxHp: owner.side === "player" ? owner.maxHp : target.maxHp,
    opponentMaxHp: owner.side === "opponent" ? owner.maxHp : target.maxHp,
  };
}

/** 生成战斗总结 */
function generateSummary(
  player: Character,
  opponent: Character,
  winner: "player" | "opponent" | "draw",
  totalRounds: number,
  actions: BattleAction[]
): string {
  const totalPlayerDmg = actions
    .filter((a) => a.attacker === "player" && !a.isMiss)
    .reduce((sum, a) => sum + a.damage, 0);
  const totalOpponentDmg = actions
    .filter((a) => a.attacker === "opponent" && !a.isMiss)
    .reduce((sum, a) => sum + a.damage, 0);
  const playerCrits = actions.filter((a) => a.attacker === "player" && a.isCrit).length;
  const opponentCrits = actions.filter((a) => a.attacker === "opponent" && a.isCrit).length;

  if (winner === "draw") {
    return `激战 ${totalRounds} 回合，${player.name} 与 ${opponent.name} 势均力敌，难分高下！双方总伤害：${totalPlayerDmg} vs ${totalOpponentDmg}。`;
  }

  const winnerChar = winner === "player" ? player : opponent;
  const loserChar = winner === "player" ? opponent : player;
  const winnerDmg = winner === "player" ? totalPlayerDmg : totalOpponentDmg;
  const winnerCrits = winner === "player" ? playerCrits : opponentCrits;

  let summary = `经过 ${totalRounds} 回合的激战，${winnerChar.name} 击败了 ${loserChar.name}！总伤害 ${winnerDmg}`;
  if (winnerCrits > 0) summary += `，其中 ${winnerCrits} 次暴击`;
  summary += "。";
  return summary;
}

/** 主对战函数 */
export function runBattle(player: Character, opponent: Character): BattleResult {
  // 使用最新 HP 公式重算，覆盖 DB 中可能过时的 max_hp
  const pHp = calcMaxHp(player);
  const oHp = calcMaxHp(opponent);
  player = { ...player, max_hp: pHp };
  opponent = { ...opponent, max_hp: oHp };

  const playerState: FighterState = {
    char: player,
    hp: pHp,
    maxHp: pHp,
    side: "player",
    skillCooldowns: new Map(),
    underdogBonus: calcUnderdogBonus(player, opponent),
  };

  const opponentState: FighterState = {
    char: opponent,
    hp: oHp,
    maxHp: oHp,
    side: "opponent",
    skillCooldowns: new Map(),
    underdogBonus: calcUnderdogBonus(opponent, player),
  };

  const actions: BattleAction[] = [];

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    // 减少冷却
    for (const [key, val] of playerState.skillCooldowns) {
      if (val > 0) playerState.skillCooldowns.set(key, val - 1);
    }
    for (const [key, val] of opponentState.skillCooldowns) {
      if (val > 0) opponentState.skillCooldowns.set(key, val - 1);
    }

    // 先手判定
    const [first, second] = determineInitiative(playerState, opponentState);

    // 第一个行动
    actions.push(executeAttack(first, second, round));
    if (second.hp <= 0) break;

    // 特殊物品触发（第一个行动者）
    const item1 = tryTriggerItem(first.char);
    if (item1 && second.hp > 0) {
      actions.push(executeItemTrigger(first, second, item1, round));
      if (second.hp <= 0) break;
    }

    // 第二个行动
    actions.push(executeAttack(second, first, round));
    if (first.hp <= 0) break;

    // 特殊物品触发（第二个行动者）
    const item2 = tryTriggerItem(second.char);
    if (item2 && first.hp > 0) {
      actions.push(executeItemTrigger(second, first, item2, round));
      if (first.hp <= 0) break;
    }
  }

  // 判定胜负
  let winner: "player" | "opponent" | "draw";
  if (playerState.hp <= 0 && opponentState.hp <= 0) {
    winner = "draw";
  } else if (opponentState.hp <= 0) {
    winner = "player";
  } else if (playerState.hp <= 0) {
    winner = "opponent";
  } else {
    // 10 回合结束，比较剩余 HP 百分比（差距 < 2% 才算平手）
    const playerPct = playerState.hp / playerState.maxHp;
    const opponentPct = opponentState.hp / opponentState.maxHp;
    if (Math.abs(playerPct - opponentPct) < 0.02) {
      winner = "draw";
    } else {
      winner = playerPct > opponentPct ? "player" : "opponent";
    }
  }

  const totalRounds = actions.length > 0 ? actions[actions.length - 1].round : 0;

  return {
    player,
    opponent,
    winner,
    rounds: actions,
    totalRounds,
    summary: generateSummary(player, opponent, winner, totalRounds, actions),
  };
}
