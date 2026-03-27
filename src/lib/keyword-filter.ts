// 敏感词过滤模块 — 仅后端使用，不暴露词表给前端
// 设计原则：针对对战游戏语境，只拦截在任何游戏设定下都不合理的内容
// 武器、爆炸、战斗动作、黑暗角色设定等游戏合法词汇不做拦截

// ── 真实政治人物 & 政治事件 ──
// 用真实领导人/政治事件做游戏角色有法律和政治风险
const POLITICS = [
  // 中国领导人
  "习近平", "毛泽东", "邓小平", "江泽民", "胡锦涛", "温家宝",
  "李克强", "李强", "周恩来", "蒋介石",
  // 外国领导人
  "特朗普", "奥巴马", "拜登", "普京", "金正恩", "泽连斯基",
  // 政党/组织
  "共产党", "国民党", "民进党", "中共", "法轮功", "大纪元", "统一教",
  // 政治事件/运动
  "六四", "天安门", "文革", "文化大革命", "真善忍",
  // 分裂主义
  "台独", "藏独", "疆独", "港独",
  // 政治隐语/谐音梗
  "维尼", "小熊维尼", "翠", "庆丰", "习包", "刁",
  // 政治攻击性用语
  "共匪", "赤匪", "反华", "反共",
];

// ── 涉藏/涉疆/涉伊斯兰宗教（大陆语境高度敏感） ──
const SENSITIVE_RELIGION = [
  "达赖", "喇嘛", "活佛",
  "真主", "安拉", "圣战", "jihad", "穆罕默德", "古兰经",
  "维族", "维吾尔",
];

// ── 种族歧视（任何语境无正当用途） ──
const RACISM = [
  "nigger", "negro", "chink", "jap",
  "支那", "黑鬼", "白皮", "黄皮",
];

// ── 显性色情（具体性行为描述，无游戏语境） ──
const SEXUAL = [
  "做爱", "性交", "口交", "肛交", "自慰", "手淫", "阴茎", "阴道",
  "高潮", "潮吹", "乳交", "足交", "颜射", "内射", "中出",
  "porn", "hentai",
];

// ── BDSM/性虐（大陆平台审核红线） ──
const BDSM = [
  "SM", "调教", "捆绑", "母狗",
];

// ── 性交易 ──
const SEX_TRADE = [
  "援交", "卖淫", "嫖娼", "妓女", "鸡婆", "外围",
];

// ── 儿童性相关（全球硬性红线） ──
const CHILD_ABUSE = [
  "恋童", "幼女", "童交", "正太",
];

// ── 毒品（大陆禁毒审查严格） ──
const DRUGS = [
  "冰毒", "海洛因", "大麻", "可卡因", "摇头丸", "K粉", "氯胺酮",
  "鸦片", "吗啡", "麻古", "安非他命", "LSD", "致幻剂",
  "制毒", "贩毒", "吸毒",
];

// 汇总（全部小写化以便匹配）
const ALL_BANNED: string[] = [
  ...POLITICS,
  ...SENSITIVE_RELIGION,
  ...RACISM,
  ...SEXUAL,
  ...BDSM,
  ...SEX_TRADE,
  ...CHILD_ABUSE,
  ...DRUGS,
].map((w) => w.toLowerCase());

/**
 * 检查关键词列表是否包含敏感内容
 * @returns 若安全返回 null；若命中返回通用错误信息（不透露具体触发词）
 */
export function checkKeywords(keywordList: string[]): string | null {
  const joined = keywordList.join(" ").toLowerCase();
  for (const banned of ALL_BANNED) {
    if (joined.includes(banned)) {
      return "关键词包含敏感内容，请更换后重试";
    }
  }
  return null;
}

/**
 * 批量检查（供清理脚本使用）
 * @returns 命中的敏感词列表
 */
export function findBannedWords(keywordList: string[]): string[] {
  const joined = keywordList.join(" ").toLowerCase();
  return ALL_BANNED.filter((banned) => joined.includes(banned));
}
