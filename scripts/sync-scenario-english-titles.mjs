import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceRoot = path.resolve(__dirname, "..");
const scenariosPath = path.join(serviceRoot, "data", "csv", "scenarios.csv");

const sceneEnglishTitles = {
  "a1-01": "Greetings and Self-Introductions",
  "a1-02": "Basic Personal Information",
  "a1-03": "Common Objects and Classroom Items",
  "a1-04": "Numbers, Time, Dates, and Days",
  "a1-05": "Colors, Animals, and Body Parts",
  "a1-06": "Family and Relatives",
  "a1-07": "Simple Daily Preferences",
  "a1-08": "Talking About the Weather",
  "a1-09": "Simple Directions and Navigation",
  "a1-10": "Basic Ordering Food",
  "a1-11": "School and Classroom Routines",
  "a2-01": "Shopping for Price, Size, and Color",
  "a2-02": "Full Restaurant Ordering",
  "a2-03": "Describing Appearance and Personality",
  "a2-04": "Daily Routines and Habits",
  "a2-05": "Invitations, Scheduling, and Plans",
  "a2-06": "Phone Calls and Messages",
  "a2-07": "Seeing a Doctor and Describing Symptoms",
  "a2-08": "Transportation and Getting Around",
  "a2-09": "Hobbies and Entertainment",
  "a2-10": "Thanks, Apologies, and Asking for Help",
  "a2-11": "Simple Past Events",
  "a2-12": "Hotel Check-In and Basic Renting",
  "b1-01": "Travel Planning and Preparation",
  "b1-02": "Basic Job Interviews",
  "b1-03": "Opinions and Simple Reasons",
  "b1-04": "Past Experiences and Memories",
  "b1-05": "Future Plans and Dreams",
  "b1-06": "Movies, Books, and Music",
  "b1-07": "Food, Health, and Exercise",
  "b1-08": "Campus Study and Exams",
  "b1-09": "Expressing Emotions",
  "b1-10": "Parties, Visiting, and Social Etiquette",
  "b1-11": "Complaints and Suggestions",
  "b1-12": "The Environment and Social Topics",
  "b2-01": "Workplace Communication",
  "b2-02": "Cultural Differences and Customs",
  "b2-03": "Education, Studying Abroad, and Majors",
  "b2-04": "Technology, the Internet, and Social Media",
  "b2-05": "Consumption, Finance, and Economic Thinking",
  "b2-06": "Mental Health and Stress Management",
  "b2-07": "Discussing Social Issues",
  "b2-08": "Art, Literature, and Criticism",
  "b2-09": "Negotiation and Simple Bargaining",
  "b2-10": "Presentations and Public Speaking",
  "b2-11": "News and Media Commentary",
  "b2-12": "Rules, Contracts, and Rights",
  "c1-01": "Academic Discussions and Class Debates",
  "c1-02": "Team Management and Project Communication",
  "c1-03": "International Politics and Social Issues",
  "c1-04": "Ethics and Moral Questions",
  "c1-05": "Economic Trends and Business Analysis",
  "c1-06": "Resolving Cross-Cultural Conflicts",
  "c1-07": "Formal Speeches and Debates",
  "c1-08": "Professional Communication",
  "c1-09": "Media Criticism and Information Literacy",
  "c1-10": "Deep Psychological and Emotional Communication",
  "c2-01": "Literature and Linguistics",
  "c2-02": "International Conferences and Diplomacy",
  "c2-03": "High-Precision Professional Communication",
  "c2-04": "Rhetoric, Writing, and Creative Expression",
  "c2-05": "Globalization, Climate, and Macro Issues",
};

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

  return rows;
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

const raw = await fs.readFile(scenariosPath, "utf8");
const rows = parseCsv(raw);
const [header, ...dataRows] = rows;

const nextHeader = header.includes("scene_title_en") ? [...header] : [...header, "scene_title_en"];
const sceneSlugIndex = header.indexOf("scene_slug");
const sceneTitleEnIndex = nextHeader.indexOf("scene_title_en");

const normalizedRows = dataRows.map((values) => {
  const row = [...values];
  while (row.length < nextHeader.length) {
    row.push("");
  }

  const sceneSlug = row[sceneSlugIndex] ?? "";
  row[sceneTitleEnIndex] = sceneEnglishTitles[sceneSlug] ?? "";
  return row;
});

const output = [nextHeader, ...normalizedRows]
  .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
  .join("\n");

await fs.writeFile(scenariosPath, `${output}\n`, "utf8");
console.log(`Updated ${normalizedRows.length} rows in scenarios.csv`);
