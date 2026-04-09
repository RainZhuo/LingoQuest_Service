import { readTable, writeTable } from "../lib/tableStore.js";

type DiscoverScenarioRow = {
  slug: string;
  topic: string;
  title: string;
  subtitle: string;
  cue: string;
  openingLine: string;
  creator: string;
  downloads: string;
  summary: string;
  levelsJson: string;
};

type DiscoverWordBookRow = {
  slug: string;
  title: string;
  description: string;
  wordCount: string;
  creator: string;
  downloads: string;
  summary: string;
  wordsTable: string;
};

type DiscoverWordRow = {
  bookSlug: string;
  word: string;
  chinese: string;
  phonetic: string;
  example: string;
  topic: string;
  sortOrder: string;
};

const discoverScenarioHeaders = [
  "slug",
  "topic",
  "title",
  "subtitle",
  "cue",
  "openingLine",
  "creator",
  "downloads",
  "summary",
  "levelsJson",
];

const discoverWordBookHeaders = [
  "slug",
  "title",
  "description",
  "wordCount",
  "creator",
  "downloads",
  "summary",
  "wordsTable",
];

const discoverWordHeaders = ["bookSlug", "word", "chinese", "phonetic", "example", "topic", "sortOrder"];

const seedScenarios = [
  {
    slug: "job-interview",
    topic: "Interview",
    title: "面试高频回答",
    subtitle: "自我介绍、优缺点、离职原因",
    cue: "适合准备校招、社招和英文初筛，先把最常见的回答练顺。",
    openingLine: "先说重点，再补充细节，让回答有条理。",
    creator: "LingLi_IELTS",
    downloads: 328,
    summary: "把英文面试里最容易卡住的三类问题拆成关卡。",
    levels: [
      {
        slug: "self-intro",
        order: 1,
        title: "第 1 关 · 自我介绍",
        subtitle: "学会 30 秒说清自己的背景和方向",
        topicHint: "job interview self introduction background role",
        targetOutcome: "完成一轮英文自我介绍，并记住 1 句能复用的开场。",
      },
      {
        slug: "strengths",
        order: 2,
        title: "第 2 关 · 优势表达",
        subtitle: "学会说自己的优势，不空泛也不太夸张",
        topicHint: "job interview strengths teamwork ownership",
        targetOutcome: "完成一轮优势表达，并学会 1 句自然承接例子的句子。",
      },
      {
        slug: "career-change",
        order: 3,
        title: "第 3 关 · 离职或转岗原因",
        subtitle: "学会解释变动原因，同时保持职业感",
        topicHint: "job interview career change reason transition",
        targetOutcome: "完成一轮原因说明，并掌握 1 句稳妥表达。",
      },
    ],
  },
  {
    slug: "study-abroad",
    topic: "Study Abroad",
    title: "留学日常生存",
    subtitle: "租房、报到、找老师沟通",
    cue: "适合准备出国前，把学校和生活里的高频沟通先练熟。",
    openingLine: "先交代背景，再提出你的请求或问题。",
    creator: "CampusPilot",
    downloads: 191,
    summary: "把留学落地后的高频对话按生活线拆出来。",
    levels: [
      {
        slug: "dorm-check-in",
        order: 1,
        title: "第 1 关 · 宿舍入住",
        subtitle: "学会确认宿舍信息和拿钥匙",
        topicHint: "study abroad dorm check in key housing office",
        targetOutcome: "完成一轮宿舍入住对话，并记住 1 句报信息表达。",
      },
      {
        slug: "course-office-hours",
        order: 2,
        title: "第 2 关 · 找老师 Office Hour",
        subtitle: "学会礼貌提问和说明困难",
        topicHint: "study abroad office hour ask question assignment",
        targetOutcome: "完成一轮问老师对话，并掌握 1 句礼貌开场。",
      },
      {
        slug: "roommate-discussion",
        order: 3,
        title: "第 3 关 · 和室友沟通",
        subtitle: "学会提规则、说需求、避免冲突",
        topicHint: "study abroad roommate noise clean shared space",
        targetOutcome: "完成一轮室友沟通，并学会 1 句缓和表达。",
      },
    ],
  },
];

const officeWords = [
  ["agenda", "议程", "/əˈdʒendə/", "Let's go through the agenda before the meeting starts.", "会议"],
  ["deadline", "截止日期", "/ˈdedlaɪn/", "We need to finish the draft before the deadline.", "项目"],
  ["handover", "交接", "/ˈhændˌəʊvə(r)/", "I will send a full handover note before I leave.", "协作"],
  ["follow-up", "后续跟进", "/ˈfɒləʊ ʌp/", "I'll send a follow-up email this afternoon.", "邮件"],
  ["alignment", "对齐、一致", "/əˈlaɪnmənt/", "We need alignment on the launch date.", "协作"],
  ["stakeholder", "相关方", "/ˈsteɪkˌhəʊldə(r)/", "The stakeholders want a short weekly update.", "项目"],
];

const travelWords = [
  ["boarding pass", "登机牌", "/ˈbɔːdɪŋ pɑːs/", "I can't find my boarding pass on my phone.", "机场"],
  ["itinerary", "行程单", "/aɪˈtɪnərəri/", "Could you email me the updated itinerary?", "机场"],
  ["check-in", "办理入住/值机", "/ˈtʃek ɪn/", "What time does check-in open?", "酒店"],
  ["reservation", "预订", "/ˌrezəˈveɪʃn/", "I have a reservation under Zhang.", "酒店"],
  ["platform", "站台", "/ˈplætfɔːm/", "Which platform does the train leave from?", "交通"],
  ["detour", "绕行", "/ˈdiːtʊə(r)/", "We had to take a detour because the road was closed.", "交通"],
];

const seedWordBooks = [
  {
    slug: "office-english-pack",
    title: "职场高频表达词书",
    description: "围绕会议、汇报、邮件和协作整理的实用词书。",
    wordCount: officeWords.length,
    creator: "PM_Amy",
    downloads: 504,
    summary: "适合刚开始用英语沟通工作的用户。",
    wordsTable: "discover_words_office.csv",
    words: officeWords,
  },
  {
    slug: "travel-survival-pack",
    title: "旅行生存词书",
    description: "机场、酒店、交通、求助这几类最实用词汇。",
    wordCount: travelWords.length,
    creator: "TripNorth",
    downloads: 287,
    summary: "适合旅行前短时间快速准备。",
    wordsTable: "discover_words_travel.csv",
    words: travelWords,
  },
];

async function ensureSeedData() {
  const scenarios = (await readTable("discover_scenarios.csv", discoverScenarioHeaders)) as DiscoverScenarioRow[];
  if (scenarios.length === 0) {
    await writeTable(
      "discover_scenarios.csv",
      discoverScenarioHeaders,
      seedScenarios.map((item) => ({
        slug: item.slug,
        topic: item.topic,
        title: item.title,
        subtitle: item.subtitle,
        cue: item.cue,
        openingLine: item.openingLine,
        creator: item.creator,
        downloads: String(item.downloads),
        summary: item.summary,
        levelsJson: JSON.stringify(item.levels),
      })),
    );
  }

  const wordBooks = (await readTable("discover_word_books.csv", discoverWordBookHeaders)) as DiscoverWordBookRow[];
  if (wordBooks.length === 0) {
    await writeTable(
      "discover_word_books.csv",
      discoverWordBookHeaders,
      seedWordBooks.map((item) => ({
        slug: item.slug,
        title: item.title,
        description: item.description,
        wordCount: String(item.wordCount),
        creator: item.creator,
        downloads: String(item.downloads),
        summary: item.summary,
        wordsTable: item.wordsTable,
      })),
    );
  }

  for (const item of seedWordBooks) {
    const rows = await readTable(item.wordsTable, discoverWordHeaders);
    if (rows.length > 0) {
      continue;
    }

    await writeTable(
      item.wordsTable,
      discoverWordHeaders,
      item.words.map((wordRow, index) => ({
        bookSlug: item.slug,
        word: wordRow[0],
        chinese: wordRow[1],
        phonetic: wordRow[2],
        example: wordRow[3],
        topic: wordRow[4],
        sortOrder: String(index + 1),
      })),
    );
  }
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function listDiscoverScenarios() {
  await ensureSeedData();
  const rows = (await readTable("discover_scenarios.csv", discoverScenarioHeaders)) as DiscoverScenarioRow[];

  return rows.map((row) => ({
    slug: row.slug,
    topic: row.topic,
    title: row.title,
    subtitle: row.subtitle,
    cue: row.cue,
    openingLine: row.openingLine,
    coachPrompt: "",
    creator: row.creator,
    downloads: toNumber(row.downloads),
    summary: row.summary,
    levels: JSON.parse(row.levelsJson) as Array<{
      slug: string;
      order: number;
      title: string;
      subtitle: string;
      topicHint: string;
      targetOutcome: string;
    }>,
  }));
}

export async function listDiscoverWordBooks() {
  await ensureSeedData();
  const rows = (await readTable("discover_word_books.csv", discoverWordBookHeaders)) as DiscoverWordBookRow[];

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    wordCount: toNumber(row.wordCount),
    creator: row.creator,
    downloads: toNumber(row.downloads),
    summary: row.summary,
  }));
}
