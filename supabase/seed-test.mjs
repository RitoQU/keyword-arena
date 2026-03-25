// 生成少量 NPC 用于测试（10个）
import { readFileSync } from "fs";
const envContent = readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_KEYWORDS = [
  ["火焰", "龙", "骑士"], ["冰霜", "女巫", "月亮"], ["机械", "义体", "黑客"],
  ["樱花", "武士", "剑"], ["雷电", "神话", "锤子"], ["暗影", "刺客", "毒药"],
  ["光明", "圣骑士", "盾"], ["海洋", "海盗", "炮弹"], ["沙漠", "法老", "诅咒"],
  ["森林", "精灵", "弓箭"],
];

function buildPrompt(keywords) {
  return `根据关键词【${keywords.join("、")}】生成一个游戏角色。六维属性总点数60-80，每项3-20。HP=CON*8+20。武器/防具/技能/物品各最多3个。只返回JSON：{"name":"角色名","description":"描述","str":10,"dex":10,"con":10,"int_val":10,"wis":10,"cha":10,"weapons":[{"name":"武器","type":"类型","attack":15,"effect":"效果"}],"armors":[{"name":"防具","type":"类型","defense":10,"effect":"效果"}],"skills":[{"name":"技能","source":"来源","damage":25,"effect":"效果","cooldown":2}],"items":[{"name":"物品","description":"描述","effect":"效果","power":5}]}`;
}

async function main() {
  // 检查已有
  const chk = await fetch(`${SUPABASE_URL}/rest/v1/characters?is_system=eq.true&select=id`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  const existing = await chk.json();
  console.log(`已有 ${existing.length} 个系统角色`);
  
  let ok = 0, fail = 0;
  for (let i = 0; i < TEST_KEYWORDS.length; i++) {
    const kw = TEST_KEYWORDS[i];
    process.stdout.write(`[${i+1}/${TEST_KEYWORDS.length}] ${kw.join("、")} ... `);
    
    try {
      const resp = await fetch("https://api.minimax.chat/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${MINIMAX_API_KEY}` },
        body: JSON.stringify({
          model: "MiniMax-Text-01",
          messages: [
            { role: "system", content: "你是一个游戏角色设计师，只返回JSON格式数据。" },
            { role: "user", content: buildPrompt(kw) }
          ],
          temperature: 0.95, max_tokens: 1500
        })
      });
      
      if (!resp.ok) {
        console.log(`❌ API ${resp.status}`);
        fail++;
        continue;
      }
      
      const result = await resp.json();
      const content = result.choices?.[0]?.message?.content;
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);
      
      const maxHp = data.con * 8 + 20;
      const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/characters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          user_id: null, name: data.name, keywords: kw.join("、"),
          description: data.description,
          str: data.str, dex: data.dex, con: data.con,
          int_val: data.int_val, wis: data.wis, cha: data.cha,
          max_hp: maxHp,
          weapons: data.weapons, armors: data.armors,
          skills: data.skills, items: data.items,
          is_system: true
        })
      });
      
      if (insertResp.ok) {
        console.log(`✅ ${data.name}`);
        ok++;
      } else {
        const err = await insertResp.text();
        console.log(`❌ DB: ${err.slice(0, 80)}`);
        fail++;
      }
    } catch (e) {
      console.log(`❌ ${e.message}`);
      fail++;
    }
    
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`\n完成！成功: ${ok}, 失败: ${fail}`);
}

main();
