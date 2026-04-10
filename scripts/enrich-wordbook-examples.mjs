import fs from "node:fs/promises";
import path from "node:path";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const [header, ...dataRows] = rows;
  return dataRows.map((values) => {
    const record = {};
    header.forEach((key, index) => {
      record[key] = values[index] ?? "";
    });
    return record;
  });
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

function toCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function inferPos(chinese) {
  const normalized = String(chinese || "").toLowerCase();
  if (normalized.startsWith("n.")) return "noun";
  if (normalized.startsWith("v.")) return "verb";
  if (normalized.startsWith("adj.")) return "adjective";
  if (normalized.startsWith("adv.")) return "adverb";
  if (normalized.startsWith("phrase.")) return "phrase";
  return "unknown";
}

function startsWithVowel(word) {
  return /^[aeiou]/i.test(word);
}

function withArticle(word) {
  if (/\s/.test(word) || /-/i.test(word)) return word;
  if (/s$/i.test(word) && !/ss$/i.test(word)) return word;
  return `${startsWithVowel(word) ? "an" : "a"} ${word}`;
}

function buildTopicSentence(topic) {
  if (topic.includes("气象")) return "The forecast changed again this afternoon.";
  if (topic.includes("教育")) return "The teacher explained the idea with a simple example.";
  if (topic.includes("经济")) return "The report focused on market changes this quarter.";
  if (topic.includes("环境")) return "The article discussed the issue in a practical context.";
  if (topic.includes("医学")) return "The doctor mentioned it during the consultation.";
  if (topic.includes("音乐")) return "The students heard it during music class.";
  if (topic.includes("艺术")) return "The guide mentioned it during the exhibition.";
  if (topic.includes("法律")) return "The lawyer referred to it in court.";
  if (topic.includes("军事")) return "The officer mentioned it in the briefing.";
  if (topic.includes("数学")) return "The teacher wrote it on the board.";
  return "It came up in today's lesson.";
}

function buildExample(word, chinese, topic) {
  const pos = inferPos(chinese);

  if (pos === "verb") {
    return `We need to ${word} the problem before the next class.`;
  }

  if (pos === "adjective") {
    if (topic.includes("气象")) {
      return `The weather felt ${word} all morning.`;
    }
    return `The situation became ${word} much sooner than we expected.`;
  }

  if (pos === "adverb") {
    return `She answered ${word} during the discussion.`;
  }

  if (pos === "phrase") {
    return `The speaker used "${word}" in a short dialogue.`;
  }

  if (word.includes(" ")) {
    return `We heard the phrase "${word}" in today's conversation practice.`;
  }

  if (/^[A-Z]/.test(word)) {
    return `${word} appeared in the reading for today's lesson.`;
  }

  return `${buildTopicSentence(topic)} ${withArticle(word)} was mentioned as a key term.`;
}

async function main() {
  const filePath = path.resolve(process.cwd(), "data", "csv", "wordbook_tables", "categorized_collection.csv");
  const content = await fs.readFile(filePath, "utf8");
  const rows = parseCsv(content);
  const headers = Object.keys(rows[0] ?? {});

  const nextRows = rows.map((row) => ({
    ...row,
    example: buildExample(row.word, row.chinese, row.topic),
  }));

  await fs.writeFile(filePath, toCsv(nextRows, headers), "utf8");
  console.log(`Updated examples for ${nextRows.length} word rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
