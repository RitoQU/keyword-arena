// 敏感词过滤模块 — 仅后端使用，不暴露词表给前端

// 政治相关
const POLITICS = [
  "共产党", "国民党", "民进党", "习近平", "毛泽东", "邓小平", "江泽民",
  "胡锦涛", "温家宝", "李克强", "李强", "周恩来", "蒋介石",
  "台独", "藏独", "疆独", "港独", "六四", "天安门", "文革", "文化大革命",
  "法轮功", "大纪元", "反华", "反共", "颠覆", "政变", "独裁",
  "维尼", "小熊维尼", "翠", "庆丰", "包子", "刁", "习包",
  "共匪", "支那", "赤匪", "中共", "贸易战",
  "特朗普", "奥巴马", "拜登", "普京", "金正恩", "泽连斯基",
  "统一教", "真善忍",
];

// 宗教 / 民族敏感
const RELIGION = [
  "真主", "安拉", "圣战", "jihad", "穆罕默德", "古兰经",
  "达赖", "喇嘛", "活佛",
  "邪教", "异端", "传教",
  "回族", "维族", "维吾尔",
];

// 色情 / 成人内容
const ADULT = [
  "做爱", "性交", "口交", "肛交", "自慰", "手淫", "阴茎", "阴道",
  "高潮", "潮吹", "乳交", "足交", "颜射", "内射", "中出",
  "援交", "卖淫", "嫖娼", "妓女", "鸡婆", "小姐", "外围",
  "调教", "捆绑", "SM", "奴隶", "母狗",
  "幼女", "萝莉", "正太", "恋童", "童交",
  "porn", "hentai", "sex",
];

// 暴力 / 血腥 / 恐怖
const VIOLENCE = [
  "杀人", "砍人", "分尸", "碎尸", "活剥", "虐杀", "处刑",
  "恐怖袭击", "炸弹", "爆炸", "屠杀", "灭族", "种族灭绝",
  "自杀", "割腕", "跳楼", "上吊",
  "school shooting", "mass murder",
];

// 毒品
const DRUGS = [
  "冰毒", "海洛因", "大麻", "可卡因", "摇头丸", "K粉", "氯胺酮",
  "鸦片", "吗啡", "麻古", "安非他命", "LSD", "致幻剂",
  "制毒", "贩毒", "吸毒",
];

// 歧视 / 侮辱
const DISCRIMINATION = [
  "nigger", "negro", "chink", "jap",
  "弱智", "废物", "贱人", "婊子", "绿茶婊", "白莲花",
  "女拳", "男权", "打拳", "杀男", "杀女",
  "田园女权", "女利",
  "殖民", "黑鬼", "白皮", "黄皮",
];

// 性别对立
const GENDER = [
  "普信男", "小仙女", "国男", "国女",
  "彩礼", "倒贴", "娶不起", "嫁不出",
  "incel",
];

// 汇总为统一词表（全部小写化以便匹配）
const ALL_BANNED: string[] = [
  ...POLITICS,
  ...RELIGION,
  ...ADULT,
  ...VIOLENCE,
  ...DRUGS,
  ...DISCRIMINATION,
  ...GENDER,
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
