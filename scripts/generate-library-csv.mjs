import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceRoot = path.resolve(__dirname, "..");
const frontendRoot = path.resolve(serviceRoot, "..", "LingoQuest");
const csvRoot = path.join(serviceRoot, "data", "csv");
const wordbookTablesRoot = path.join(csvRoot, "wordbook_tables");
const deckFile = path.join(frontendRoot, "src", "data", "ielts-word-deck.ts");

const curriculum = [
  {
    bandCode: "A1",
    bandTitle: "入门级（生存英语）",
    descriptor: "以看懂、会说、敢开口为主，先解决最常见的生存沟通需求。",
    scenes: [
      "问候与自我介绍",
      "个人基础信息（姓名、年龄、国籍）",
      "常见物品与教室用品",
      "数字、时间、日期、星期",
      "颜色、动物、身体部位",
      "家庭与家人介绍",
      "日常简单喜好",
      "天气描述",
      "简单问路与方向",
      "简易点餐",
      "学校与课堂日常",
    ],
  },
  {
    bandCode: "A2",
    bandTitle: "初级（日常事务英语）",
    descriptor: "把简单句连成完整交流，能处理日常事务、安排、求助与描述。",
    scenes: [
      "购物（问价、尺码、颜色）",
      "餐厅完整点餐",
      "描述外貌与性格",
      "日常作息与习惯",
      "邀约、安排时间与计划",
      "打电话与留言",
      "看病与描述不适",
      "交通出行（公交、地铁、打车）",
      "兴趣爱好与娱乐",
      "感谢、道歉、请求帮助",
      "简单过去时事件（昨天做了什么）",
      "酒店入住与简易租房",
    ],
  },
  {
    bandCode: "B1",
    bandTitle: "中级（生活 + 观点表达）",
    descriptor: "开始组织信息、补充理由、表达态度，并能完成生活化的多轮沟通。",
    scenes: [
      "旅行规划与出行准备",
      "基础求职面试",
      "表达观点与简单理由",
      "过去经历与回忆",
      "未来计划与梦想",
      "电影、书籍、音乐等娱乐话题",
      "饮食、健康与运动",
      "校园学习与考试",
      "情绪表达",
      "聚会、做客与社交礼仪",
      "投诉与提建议",
      "环保与简单社会话题",
    ],
  },
  {
    bandCode: "B2",
    bandTitle: "中高级（深入讨论 + 职场）",
    descriptor: "能在复杂生活与工作场景中清楚解释、比较、协商和推进事情。",
    scenes: [
      "职场沟通（会议、汇报、邮件）",
      "文化差异与习俗交流",
      "教育、留学与专业选择",
      "科技、网络与社交媒体",
      "消费、理财与经济观念",
      "心理健康与压力管理",
      "社会问题讨论",
      "艺术、文学与评论",
      "协商与简单谈判",
      "演讲与展示（Presentation）",
      "新闻与媒体评论",
      "规则、合同与权利义务",
    ],
  },
  {
    bandCode: "C1",
    bandTitle: "高级（学术 / 专业交流）",
    descriptor: "面向高密度信息、专业协作与正式表达，强调论证、回应和精确措辞。",
    scenes: [
      "学术讨论与课堂辩论",
      "团队管理与项目沟通",
      "国际政治与社会议题",
      "伦理与道德话题",
      "经济趋势与商业分析",
      "跨文化冲突解决",
      "正式演讲与辩论",
      "专业领域交流（医学 / 法律 / IT / 教育）",
      "媒体批判与信息素养",
      "深度心理与情感沟通",
    ],
  },
  {
    bandCode: "C2",
    bandTitle: "精通级（母语级精准交流）",
    descriptor: "以高精度、高复杂度、高语域切换能力为目标，追求接近母语使用者的表达控制力。",
    scenes: [
      "文学、语言学深度探讨",
      "国际会议与外交谈判",
      "高精专业表达（法律、医学）",
      "修辞、写作与创作",
      "全球化、气候等顶层议题",
    ],
  },
];

const bandStageProfiles = {
  A1: [
    {
      key: "survival-input",
      name: "识别场景",
      summary: "先认人、认物、认动作，听懂并看懂场景里最基础的信息。",
      objective: (scene) => `能识别“${scene}”中最基础的对象、问题和回应方式，知道开口时先说什么。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 2 轮极短对话，突出问候、确认和基础回应。`,
      vocabularySeed: (scene) => `提取“${scene}”里最先必须会的 6 个高频词或短语。`,
      grammarSeed: "聚焦 be 动词、基础疑问句、简单陈述句和礼貌开场。",
      minutes: 4,
    },
    {
      key: "core-pattern",
      name: "搭句开口",
      summary: "把关键词拼成能直接复用的短句，先把嘴打开。",
      objective: (scene) => `能围绕“${scene}”说出 2 到 3 个完整短句，表达最基本的需求和信息。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 3 轮控制式对话，让学习者练习提问、回答和确认。`,
      vocabularySeed: (scene) => `提取“${scene}”里最常用的固定搭配、问句和回应句。`,
      grammarSeed: "聚焦一般现在时、there is / there are、can / can't 与基础数词时间表达。",
      minutes: 5,
    },
    {
      key: "guided-scene",
      name: "引导互动",
      summary: "进入明确场景，按提示完成一轮来回互动。",
      objective: (scene) => `能在“${scene}”里完成 3 轮引导式互动，不再只会单个词汇作答。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 3 到 4 轮引导互动，对方先说、学习者跟进回应。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于确认、重复、听不清和补充说明的表达。`,
      grammarSeed: "聚焦疑问句顺序、简单否定句和常见礼貌表达。",
      minutes: 5,
    },
    {
      key: "micro-task",
      name: "完成小任务",
      summary: "把一句一句练习变成一次完整任务输出。",
      objective: (scene) => `能独立完成一次“${scene}”小任务，做到有开场、有说明、有收尾。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 4 轮任务型对话，要求学习者完整表达自己的需求。`,
      vocabularySeed: (scene) => `提取“${scene}”里最值得反复复用的收尾句和确认句。`,
      grammarSeed: "聚焦 and / but 连接、简单 because 结构和收尾确认句。",
      minutes: 6,
    },
  ],
  A2: [
    {
      key: "task-map",
      name: "建立任务地图",
      summary: "看清场景流程，知道什么时候问、什么时候答、什么时候补信息。",
      objective: (scene) => `理解“${scene}”的基本流程，知道交流中需要主动提供哪些信息。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 2 轮任务起始对话，突出信息交换顺序。`,
      vocabularySeed: (scene) => `提取“${scene}”里最关键的流程词、动作词和服务词。`,
      grammarSeed: "聚焦一般现在时、祈使句、基础情态动词和礼貌请求。",
      minutes: 4,
    },
    {
      key: "functional-patterns",
      name: "功能句型",
      summary: "学习能立即复用的功能句，不只是背单词。",
      objective: (scene) => `能用 3 到 4 个高频句型完成“${scene}”里的问价、安排、说明和请求。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 3 轮句型替换练习，让学习者在不同信息下复用表达。`,
      vocabularySeed: (scene) => `提取“${scene}”里适合替换复用的句型骨架和槽位词。`,
      grammarSeed: "聚焦 would like, have to, need to, want to 与时间地点表达。",
      minutes: 5,
    },
    {
      key: "multi-turn-handling",
      name: "多轮应对",
      summary: "面对追问时继续说下去，而不是说一句就结束。",
      objective: (scene) => `能在“${scene}”中完成 4 轮多轮信息沟通，处理追问、确认和调整。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 4 轮情境对话，加入追问、重说和重新安排。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于解释、修改和二次确认的表达。`,
      grammarSeed: "聚焦过去式基础用法、时间顺序词和 because / so 说明关系。",
      minutes: 5,
    },
    {
      key: "daily-mission",
      name: "事务完成",
      summary: "把任务说完，说到对方能给出下一步动作。",
      objective: (scene) => `能独立完成一次“${scene}”事务沟通，把需求、限制和期望结果说清楚。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 4 到 5 轮任务型对话，要求学习者自己组织完整表达。`,
      vocabularySeed: (scene) => `提取“${scene}”里最自然的请求句、解释句和结束句。`,
      grammarSeed: "聚焦过去式 / 将来安排、比较级和更完整的复合句。",
      minutes: 6,
    },
  ],
  B1: [
    {
      key: "idea-frame",
      name: "搭建表达框架",
      summary: "先学会把观点、经历或计划组织成可理解的结构。",
      objective: (scene) => `能围绕“${scene}”组织一段有顺序的表达，而不是零散句子拼接。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 2 轮对话，突出背景、主观点和理由。`,
      vocabularySeed: (scene) => `提取“${scene}”里表达观点、时间线和态度的高频表达。`,
      grammarSeed: "聚焦一般过去时、将来表达、原因结果句和连接词。",
      minutes: 4,
    },
    {
      key: "reasoning-pattern",
      name: "补充理由",
      summary: "从“我觉得”升级到“我觉得，因为……”。",
      objective: (scene) => `能针对“${scene}”给出 2 到 3 个简单理由或例子支撑自己的表达。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 3 轮对话，要求学习者说观点并补一句理由。`,
      vocabularySeed: (scene) => `提取“${scene}”里常用的理由词、态度词和例子引导词。`,
      grammarSeed: "聚焦 because, if, when, before, after 与比较结构。",
      minutes: 5,
    },
    {
      key: "follow-up-response",
      name: "回应追问",
      summary: "面对追问继续展开，而不是停在表层回答。",
      objective: (scene) => `能在“${scene}”里完成 4 轮以上互动，回应追问并补充细节。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 4 轮多轮互动，加入追问、澄清和补充经历。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于补充、转折和个人体验描述的表达。`,
      grammarSeed: "聚焦现在完成时基础、情态动词推测和描述经历的从句。",
      minutes: 5,
    },
    {
      key: "independent-output",
      name: "独立输出",
      summary: "形成一段能单独成立的生活化表达。",
      objective: (scene) => `能独立完成一次围绕“${scene}”的多句输出，表达观点、经历或建议。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 5 轮任务型互动，要求学习者在无提示下完整表达。`,
      vocabularySeed: (scene) => `提取“${scene}”里更自然的态度表达、缓冲表达和结尾表达。`,
      grammarSeed: "聚焦复合句、让步结构和更完整的观点组织语言。",
      minutes: 6,
    },
  ],
  B2: [
    {
      key: "context-analysis",
      name: "拆解情境",
      summary: "明确利益相关方、问题背景和沟通目标。",
      objective: (scene) => `能分析“${scene}”中的立场、目标与约束，知道发言应围绕什么展开。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 2 轮场景分析型对话，突出背景和目标确认。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于分析情况、比较选项和说明限制的表达。`,
      grammarSeed: "聚焦条件句、被动语态、比较结构和解释型从句。",
      minutes: 4,
    },
    {
      key: "positioning",
      name: "立场表达",
      summary: "学会清晰表达主张、保留意见和优先级。",
      objective: (scene) => `能就“${scene}”清楚表明立场，提出建议、保留或替代方案。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 3 轮立场表达对话，让学习者比较并选择方案。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于主张、让步、比较和推荐的表达。`,
      grammarSeed: "聚焦虚拟语气基础、情态动词推断和名词化表达。",
      minutes: 5,
    },
    {
      key: "negotiation-loop",
      name: "推进协商",
      summary: "处理不同意见，把沟通往下一步推进。",
      objective: (scene) => `能在“${scene}”中处理异议、追问与分歧，把对话推进到可执行结论。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 4 轮协商型互动，加入反对意见和修正方案。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于协商、缓冲、重申重点和推进决定的表达。`,
      grammarSeed: "聚焦让步、转折、假设和更精确的逻辑衔接。",
      minutes: 5,
    },
    {
      key: "decision-output",
      name: "形成结论",
      summary: "把想法收束成决定、建议、汇报或正式回应。",
      objective: (scene) => `能围绕“${scene}”输出一段完整结论，兼顾背景、分析、建议和下一步。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 5 轮任务型沟通，让学习者形成结论并推动执行。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于总结、建议、汇报和正式回应的表达。`,
      grammarSeed: "聚焦复杂复合句、书面口头混合语域和正式场景衔接表达。",
      minutes: 6,
    },
  ],
  C1: [
    {
      key: "concept-frame",
      name: "概念框架",
      summary: "先建立概念、边界和讨论框架，避免只停留在结论表态。",
      objective: (scene) => `能围绕“${scene}”定义问题、说明边界，并建立讨论框架。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 2 轮框架型对话，突出概念界定和讨论入口。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于界定概念、限定范围和引出论证的表达。`,
      grammarSeed: "聚焦名词化、定语从句、插入结构和抽象表达。",
      minutes: 4,
    },
    {
      key: "argument-development",
      name: "展开论证",
      summary: "把观点发展成论点链，而不是只给单一句子答案。",
      objective: (scene) => `能针对“${scene}”给出清晰论点、支撑理由和反面考虑。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 3 轮论证型互动，要求学习者展开论点和例证。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于论证、引用、限定和评价的表达。`,
      grammarSeed: "聚焦高级连接词、让步结构、条件推演和抽象评价句。",
      minutes: 5,
    },
    {
      key: "counter-response",
      name: "回应挑战",
      summary: "面对质疑时能修正、反驳或重构自己的表达。",
      objective: (scene) => `能在“${scene}”中回应质疑、整合不同观点，并保持表达精确。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 4 轮交锋式对话，加入反驳、追问和立场调整。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于反驳、部分同意、重述和澄清的表达。`,
      grammarSeed: "聚焦倒装、强调结构、被动表达和高阶逻辑衔接。",
      minutes: 5,
    },
    {
      key: "professional-delivery",
      name: "专业输出",
      summary: "最终形成可以在课堂、会议或正式交流中使用的完整表达。",
      objective: (scene) => `能围绕“${scene}”完成一段专业级输出，兼顾清晰度、逻辑性和语域控制。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 5 轮正式互动，要求学习者完成专业说明、回应和总结。`,
      vocabularySeed: (scene) => `提取“${scene}”里高频但高级的学术或专业表达。`,
      grammarSeed: "聚焦复杂长句、限定性表达、模糊限制语和正式输出语域。",
      minutes: 6,
    },
  ],
  C2: [
    {
      key: "precision-orientation",
      name: "精确定位",
      summary: "先确定语域、立场和表达精度，避免只求“大概能说”。",
      objective: (scene) => `能针对“${scene}”选择合适语域，并准确界定表达目标与受众。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 2 轮高语域对话，突出语境判断和表达取舍。`,
      vocabularySeed: (scene) => `提取“${scene}”中高精度、高区分度的关键词和短语。`,
      grammarSeed: "聚焦语域切换、修饰层次、抽象名词结构和复杂限定表达。",
      minutes: 4,
    },
    {
      key: "nuanced-expression",
      name: "细腻表达",
      summary: "学会表达分寸、保留、暗含立场与微妙差异。",
      objective: (scene) => `能围绕“${scene}”表达细微差别、程度变化和隐含态度。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 3 轮细腻表达互动，要求学习者做语义区分与风格调整。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于微调语气、限定范围和表达复杂态度的词组。`,
      grammarSeed: "聚焦高级虚拟语气、评价性从句、插入评注和多重从属结构。",
      minutes: 5,
    },
    {
      key: "high-stakes-response",
      name: "高压应对",
      summary: "在高压力或高复杂度追问下保持稳定与精准。",
      objective: (scene) => `能在“${scene}”中面对追问、反驳或高压互动时保持精确和控制力。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 4 轮高压互动，加入追问、博弈和表述修正。`,
      vocabularySeed: (scene) => `提取“${scene}”里用于高风险表达、反驳、缓冲和重构的高级表达。`,
      grammarSeed: "聚焦倒装、强调、对比平衡结构和长程逻辑控制。",
      minutes: 5,
    },
    {
      key: "mastery-performance",
      name: "母语级输出",
      summary: "形成能够直接用于正式场合的高完成度表达。",
      objective: (scene) => `能围绕“${scene}”完成母语级精准输出，兼顾逻辑、语感、风格与目的。`,
      dialogueSeed: (scene) => `围绕“${scene}”设计 5 轮高完成度互动，要求学习者完成精确、自然且有风格的输出。`,
      vocabularySeed: (scene) => `提取“${scene}”里能体现高级表达控制力的代表性表达。`,
      grammarSeed: "聚焦高级修辞、长句节奏控制、风格塑造和表达精修。",
      minutes: 6,
    },
  ],
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvEscape(value) {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

function normalizeWordTopic(rawTopic) {
  const value = String(rawTopic ?? "").trim();
  const groupedPatterns = [
    [/^品德品行(?:\s+(.+))?$/, "品德"],
    [/^人类生活(?:\s+(.+))?$/, "生活"],
    [/^事物属性(?:\s+(.+))?$/, "属性"],
    [/^万事万物(?:\s+(.+))?$/, "通用概念"],
    [/^心理(?:\s+(.+))?$/, "心理"],
    [/^语言(?:\s+(.+))?$/, "语言"],
    [/^行为(?:\s+(.+))?$/, "行为"],
    [/^状态(?:\s+(.+))?$/, "状态"],
  ];

  for (const [pattern, topic] of groupedPatterns) {
    const match = value.match(pattern);
    if (!match) {
      continue;
    }

    return {
      topic,
      subtopic: match[1]?.trim() || value,
    };
  }

  return {
    topic: value,
    subtopic: value,
  };
}

function toCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function loadDeck() {
  const raw = await fs.readFile(deckFile, "utf8");
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  const arrayLiteral = raw.slice(start, end + 1);
  return Function(`return ${arrayLiteral};`)();
}

function buildSceneSlug(bandCode, sceneIndex) {
  return `${bandCode.toLowerCase()}-${String(sceneIndex + 1).padStart(2, "0")}`;
}

function getSceneTags(bandCode, sceneTitle) {
  return `${bandCode}|${slugify(sceneTitle)}`;
}

function stripChinesePrefix(value) {
  return String(value ?? "")
    .replace(/^(n|v|adj|adv|prep|pron|conj|interj|num)\.\s*/i, "")
    .replace(/[；;].*$/, "")
    .trim();
}

function buildWordHint(item, normalizedTopic) {
  const meaning = stripChinesePrefix(item.chinese);
  const focus = normalizedTopic.subtopic && normalizedTopic.subtopic !== normalizedTopic.topic
    ? `${normalizedTopic.topic}里的“${normalizedTopic.subtopic}”`
    : normalizedTopic.topic;

  return `放到“${focus}”这一类里记，先把 ${item.word} 和“${meaning}”稳定对应起来，再连同例句一起复用。`;
}

function buildScenarioRows() {
  const rows = [
    {
      node_id: "root",
      parent_id: "",
      node_type: "root",
      band_code: "",
      band_title: "LingoQuest 场景课程",
      scene_slug: "",
      scene_title: "LingoQuest 场景课程",
      stage_key: "",
      stage_title: "",
      sort_order: 0,
      is_published: "true",
      topic: "",
      summary: "英语场景课程总目录",
      objective: "",
      dialogue_seed: "",
      vocabulary_seed: "",
      grammar_seed: "",
      estimated_minutes: "",
      tags: "",
    },
  ];

  curriculum.forEach((band, bandIndex) => {
    const bandId = `band:${band.bandCode}`;
    const stageProfiles = bandStageProfiles[band.bandCode];

    rows.push({
      node_id: bandId,
      parent_id: "root",
      node_type: "band",
      band_code: band.bandCode,
      band_title: band.bandTitle,
      scene_slug: "",
      scene_title: band.bandTitle,
      stage_key: "",
      stage_title: "",
      sort_order: bandIndex + 1,
      is_published: "true",
      topic: band.bandTitle,
      summary: band.descriptor,
      objective: `完成 ${band.bandCode} 阶段的场景训练，形成可迁移的真实沟通能力。`,
      dialogue_seed: "",
      vocabulary_seed: "",
      grammar_seed: "",
      estimated_minutes: "",
      tags: band.bandCode,
    });

    band.scenes.forEach((sceneTitle, sceneIndex) => {
      const sceneSlug = buildSceneSlug(band.bandCode, sceneIndex);
      const sceneId = `scene:${sceneSlug}`;
      const totalMinutes = stageProfiles.reduce((sum, stage) => sum + stage.minutes, 0);

      rows.push({
        node_id: sceneId,
        parent_id: bandId,
        node_type: "scene",
        band_code: band.bandCode,
        band_title: band.bandTitle,
        scene_slug: sceneSlug,
        scene_title: sceneTitle,
        stage_key: "",
        stage_title: "",
        sort_order: sceneIndex + 1,
        is_published: "true",
        topic: sceneTitle,
        summary: `${band.bandTitle} 场景：${sceneTitle}`,
        objective: `围绕“${sceneTitle}”完成从输入、搭建、互动到输出的关卡训练。`,
        dialogue_seed: `围绕“${sceneTitle}”生成难度递进的场景对话，确保每一关只聚焦一个核心任务。`,
        vocabulary_seed: `围绕“${sceneTitle}”提炼高频词、功能短语、可替换句型和复用表达。`,
        grammar_seed: `根据 ${band.bandCode} 阶段特点，为“${sceneTitle}”匹配最实用的语法重点与表达结构。`,
        estimated_minutes: String(totalMinutes),
        tags: getSceneTags(band.bandCode, sceneTitle),
      });

      stageProfiles.forEach((stage, stageIndex) => {
        rows.push({
          node_id: `${sceneId}:stage:${stage.key}`,
          parent_id: sceneId,
          node_type: "stage",
          band_code: band.bandCode,
          band_title: band.bandTitle,
          scene_slug: sceneSlug,
          scene_title: sceneTitle,
          stage_key: stage.key,
          stage_title: `第 ${stageIndex + 1} 关 · ${stage.name}`,
          sort_order: stageIndex + 1,
          is_published: "true",
          topic: sceneTitle,
          summary: stage.summary,
          objective: stage.objective(sceneTitle),
          dialogue_seed: stage.dialogueSeed(sceneTitle),
          vocabulary_seed: stage.vocabularySeed(sceneTitle),
          grammar_seed: stage.grammarSeed,
          estimated_minutes: String(stage.minutes),
          tags: `${getSceneTags(band.bandCode, sceneTitle)}|${stage.key}`,
        });
      });
    });
  });

  return rows;
}

function buildWordbookRows(deck) {
  return deck.map((item, index) => {
    const normalizedTopic = normalizeWordTopic(item.topic);

    return {
      row_id: index + 1,
      book_slug: "categorized-collection",
      book_title: "按类型区分（4000词）",
      topic: normalizedTopic.topic,
      subtopic: normalizedTopic.subtopic,
      word: item.word,
      phonetic: item.phonetic,
      chinese: item.chinese,
      example: item.example,
      hint: buildWordHint(item, normalizedTopic),
      sort_order: index + 1,
    };
  });
}

async function main() {
  await fs.mkdir(wordbookTablesRoot, { recursive: true });
  const deck = await loadDeck();
  const scenarioRows = buildScenarioRows();

  const scenariosCsv = toCsv(scenarioRows, [
    "node_id",
    "parent_id",
    "node_type",
    "band_code",
    "band_title",
    "scene_slug",
    "scene_title",
    "stage_key",
    "stage_title",
    "sort_order",
    "is_published",
    "topic",
    "summary",
    "objective",
    "dialogue_seed",
    "vocabulary_seed",
    "grammar_seed",
    "estimated_minutes",
    "tags",
  ]);

  const wordbooksCsv = toCsv(
    [
      {
        book_slug: "categorized-collection",
        title: "按类型区分（4000词）",
        description: "由用户提供的 IELTS 词汇表整合而成，按主题类型归档。",
        table_name: "categorized_collection.csv",
        word_count: deck.length,
        source: "ielts-word-deck.ts",
      },
    ],
    ["book_slug", "title", "description", "table_name", "word_count", "source"],
  );

  const wordbookTableCsv = toCsv(buildWordbookRows(deck), [
    "row_id",
    "book_slug",
    "book_title",
    "topic",
    "subtopic",
    "word",
    "phonetic",
    "chinese",
    "example",
    "hint",
    "sort_order",
  ]);

  await fs.mkdir(csvRoot, { recursive: true });
  await fs.writeFile(path.join(csvRoot, "scenarios.csv"), scenariosCsv, "utf8");
  await fs.writeFile(path.join(csvRoot, "wordbooks.csv"), wordbooksCsv, "utf8");
  await fs.writeFile(path.join(wordbookTablesRoot, "categorized_collection.csv"), wordbookTableCsv, "utf8");

  console.log(
    JSON.stringify(
      {
        scenarioRows: scenarioRows.length,
        sceneCount: curriculum.reduce((sum, band) => sum + band.scenes.length, 0),
        wordCount: deck.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
