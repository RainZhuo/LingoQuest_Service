import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv, toCsv } from "./csv.js";

type CsvRow = Record<string, string>;

const tablesRoot = path.resolve(process.cwd(), "data", "tables");
const writeLocks = new Map<string, Promise<void>>();

function withLock(filePath: string, action: () => Promise<void>) {
  const previous = writeLocks.get(filePath) ?? Promise.resolve();
  const next = previous.then(action, action);
  writeLocks.set(filePath, next.catch(() => undefined));
  return next;
}

export async function ensureTable(fileName: string, headers: string[]) {
  await mkdir(tablesRoot, { recursive: true });
  const filePath = path.join(tablesRoot, fileName);

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, toCsv([], headers), "utf8");
  }

  return filePath;
}

export async function readTable(fileName: string, headers: string[]) {
  const filePath = await ensureTable(fileName, headers);
  const content = await readFile(filePath, "utf8");
  return parseCsv(content) as CsvRow[];
}

export async function writeTable(fileName: string, headers: string[], rows: CsvRow[]) {
  const filePath = await ensureTable(fileName, headers);

  await withLock(filePath, async () => {
    await writeFile(filePath, toCsv(rows, headers), "utf8");
  });
}
