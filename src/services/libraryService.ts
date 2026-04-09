import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "../lib/csv.js";

type ScenarioCsvRow = {
  node_id: string;
  parent_id: string;
  node_type: "root" | "band" | "scene" | "stage";
  band_code: string;
  band_title: string;
  scene_slug: string;
  scene_title: string;
  stage_key: string;
  stage_title: string;
  sort_order: string;
  is_published: string;
  topic: string;
  summary: string;
  objective: string;
  dialogue_seed: string;
  vocabulary_seed: string;
  grammar_seed: string;
  estimated_minutes: string;
  tags: string;
};

type WordBookCsvRow = {
  book_slug: string;
  title: string;
  description: string;
  table_name: string;
  word_count: string;
  source: string;
};

type WordBookEntryCsvRow = {
  row_id: string;
  book_slug: string;
  book_title: string;
  topic: string;
  subtopic: string;
  word: string;
  phonetic: string;
  chinese: string;
  example: string;
  sort_order: string;
};

export type LibraryScenarioStage = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  objective: string;
  dialogueSeed: string;
  vocabularySeed: string;
  grammarSeed: string;
  estimatedMinutes: number;
  tags: string[];
  sortOrder: number;
};

export type LibraryScenarioTrack = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  topic: string;
  tags: string[];
  sortOrder: number;
  bandCode: string;
  bandTitle: string;
  stages: LibraryScenarioStage[];
};

export type LibraryScenarioBand = {
  id: string;
  code: string;
  title: string;
  sortOrder: number;
  scenarios: LibraryScenarioTrack[];
};

export type LibraryWordBookSummary = {
  slug: string;
  title: string;
  description: string;
  tableName: string;
  wordCount: number;
  source: string;
};

export type LibraryWordBookCategory = {
  slug: string;
  title: string;
  wordCount: number;
};

export type LibraryWordBookWord = {
  id: string;
  topic: string;
  subtopic: string;
  word: string;
  phonetic: string;
  chinese: string;
  example: string;
  sortOrder: number;
};

export type LibraryWordBookDetail = LibraryWordBookSummary & {
  categories: LibraryWordBookCategory[];
  words: LibraryWordBookWord[];
};

const dataRoot = path.resolve(process.cwd(), "data", "csv");
const scenariosPath = path.join(dataRoot, "scenarios.csv");
const wordBooksPath = path.join(dataRoot, "wordbooks.csv");
const wordBookTablesRoot = path.join(dataRoot, "wordbook_tables");

let scenarioCache: LibraryScenarioBand[] | null = null;
let wordBookCatalogCache: LibraryWordBookSummary[] | null = null;
const wordBookDetailCache = new Map<string, LibraryWordBookDetail>();

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitTags(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readCsvFile<T extends Record<string, string>>(filePath: string) {
  const content = await readFile(filePath, "utf8");
  return parseCsv(content) as T[];
}

export async function listScenarioBands() {
  if (scenarioCache) {
    return scenarioCache;
  }

  const rows = await readCsvFile<ScenarioCsvRow>(scenariosPath);
  const bands = new Map<string, LibraryScenarioBand>();
  const scenes = new Map<string, LibraryScenarioTrack>();

  for (const row of rows) {
    if (row.node_type === "band") {
      bands.set(row.node_id, {
        id: row.node_id,
        code: row.band_code,
        title: row.band_title,
        sortOrder: toNumber(row.sort_order),
        scenarios: [],
      });
      continue;
    }

    if (row.node_type === "scene") {
      const track: LibraryScenarioTrack = {
        id: row.node_id,
        slug: row.scene_slug,
        title: row.scene_title,
        summary: row.summary,
        topic: row.topic,
        tags: splitTags(row.tags),
        sortOrder: toNumber(row.sort_order),
        bandCode: row.band_code,
        bandTitle: row.band_title,
        stages: [],
      };

      scenes.set(row.node_id, track);
      bands.get(row.parent_id)?.scenarios.push(track);
      continue;
    }

    if (row.node_type === "stage") {
      const stage: LibraryScenarioStage = {
        id: row.node_id,
        slug: row.stage_key,
        title: row.stage_title,
        summary: row.summary,
        objective: row.objective,
        dialogueSeed: row.dialogue_seed,
        vocabularySeed: row.vocabulary_seed,
        grammarSeed: row.grammar_seed,
        estimatedMinutes: toNumber(row.estimated_minutes, 6),
        tags: splitTags(row.tags),
        sortOrder: toNumber(row.sort_order),
      };

      scenes.get(row.parent_id)?.stages.push(stage);
    }
  }

  scenarioCache = Array.from(bands.values())
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((band) => ({
      ...band,
      scenarios: band.scenarios
        .map((scenario) => ({
          ...scenario,
          stages: [...scenario.stages].sort((left, right) => left.sortOrder - right.sortOrder),
        }))
        .sort((left, right) => left.sortOrder - right.sortOrder),
    }));

  return scenarioCache;
}

export async function listWordBooks() {
  if (wordBookCatalogCache) {
    return wordBookCatalogCache;
  }

  const rows = await readCsvFile<WordBookCsvRow>(wordBooksPath);
  wordBookCatalogCache = rows.map((row) => ({
    slug: row.book_slug,
    title: row.title,
    description: row.description,
    tableName: row.table_name,
    wordCount: toNumber(row.word_count),
    source: row.source,
  }));

  return wordBookCatalogCache;
}

export async function getWordBook(slug: string) {
  if (wordBookDetailCache.has(slug)) {
    return wordBookDetailCache.get(slug) ?? null;
  }

  const catalog = await listWordBooks();
  const summary = catalog.find((item) => item.slug === slug);

  if (!summary) {
    return null;
  }

  const filePath = path.join(wordBookTablesRoot, summary.tableName);
  const rows = await readCsvFile<WordBookEntryCsvRow>(filePath);
  const words = rows
    .filter((row) => row.book_slug === slug)
    .map<LibraryWordBookWord>((row) => ({
      id: row.row_id,
      topic: row.topic,
      subtopic: row.subtopic,
      word: row.word,
      phonetic: row.phonetic,
      chinese: row.chinese,
      example: row.example,
      sortOrder: toNumber(row.sort_order),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const counter = new Map<string, number>();
  for (const item of words) {
    counter.set(item.topic, (counter.get(item.topic) ?? 0) + 1);
  }

  const categories = Array.from(counter.entries())
    .map(([title, wordCount]) => ({
      slug: slugify(title),
      title,
      wordCount,
    }))
    .sort((left, right) => left.title.localeCompare(right.title, "zh-CN"));

  const detail: LibraryWordBookDetail = {
    ...summary,
    categories,
    words,
  };

  wordBookDetailCache.set(slug, detail);
  return detail;
}
