import { readTable, writeTable } from "../lib/tableStore.js";
import type { LessonCompletionRecord, UserProfile, WordProgressEntry, WordProgressStatus } from "../types.js";

const userHeaders = ["uid", "email", "displayName", "photoURL", "level", "xp", "streak", "createdAt", "lastActiveAt"];
const lessonProgressHeaders = [
  "uid",
  "lessonId",
  "topic",
  "learnerLevel",
  "score",
  "awardedXp",
  "completed",
  "completedAt",
];
const wordProgressHeaders = ["uid", "word", "status", "reviewedAt"];

function toNullable(value: string) {
  return value ? value : null;
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function listUserProfiles() {
  const rows = await readTable("users.csv", userHeaders);

  return rows.map<UserProfile>((row) => ({
    uid: row.uid,
    email: toNullable(row.email),
    displayName: toNullable(row.displayName),
    photoURL: toNullable(row.photoURL),
    level: toNumber(row.level, 1),
    xp: toNumber(row.xp, 0),
    streak: toNumber(row.streak, 0),
    createdAt: row.createdAt || new Date().toISOString(),
    lastActiveAt: row.lastActiveAt || new Date().toISOString(),
  }));
}

export async function getUserProfile(uid: string) {
  const users = await listUserProfiles();
  return users.find((item) => item.uid === uid) ?? null;
}

export async function upsertUserProfile(profile: UserProfile) {
  const users = await listUserProfiles();
  const nextUsers = users.filter((item) => item.uid !== profile.uid);
  nextUsers.push(profile);

  await writeTable(
    "users.csv",
    userHeaders,
    nextUsers.map((item) => ({
      uid: item.uid,
      email: item.email ?? "",
      displayName: item.displayName ?? "",
      photoURL: item.photoURL ?? "",
      level: String(item.level),
      xp: String(item.xp),
      streak: String(item.streak),
      createdAt: item.createdAt,
      lastActiveAt: item.lastActiveAt,
    })),
  );

  return profile;
}

export async function listLessonCompletions(uid: string) {
  const rows = await readTable("lesson_progress.csv", lessonProgressHeaders);

  return rows
    .filter((row) => row.uid === uid)
    .map<LessonCompletionRecord>((row) => ({
      uid: row.uid,
      lessonId: row.lessonId,
      topic: toNullable(row.topic),
      learnerLevel: (toNullable(row.learnerLevel) as LessonCompletionRecord["learnerLevel"]) ?? null,
      score: row.score ? toNumber(row.score, 0) : null,
      awardedXp: toNumber(row.awardedXp, 0),
      completed: true,
      completedAt: row.completedAt || new Date().toISOString(),
    }));
}

export async function getLessonCompletion(uid: string, lessonId: string) {
  const completions = await listLessonCompletions(uid);
  return completions.find((item) => item.lessonId === lessonId) ?? null;
}

export async function appendLessonCompletion(entry: LessonCompletionRecord) {
  const rows = await readTable("lesson_progress.csv", lessonProgressHeaders);
  rows.push({
    uid: entry.uid,
    lessonId: entry.lessonId,
    topic: entry.topic ?? "",
    learnerLevel: entry.learnerLevel ?? "",
    score: entry.score === null ? "" : String(entry.score),
    awardedXp: String(entry.awardedXp),
    completed: "true",
    completedAt: entry.completedAt,
  });
  await writeTable("lesson_progress.csv", lessonProgressHeaders, rows);
  return entry;
}

export async function listWordProgressByUser(uid: string) {
  const rows = await readTable("word_progress.csv", wordProgressHeaders);

  return rows
    .filter((row) => row.uid === uid)
    .map<WordProgressEntry>((row) => ({
      word: row.word,
      status: (row.status || "new") as WordProgressStatus,
      reviewedAt: row.reviewedAt || new Date().toISOString(),
    }));
}

export async function upsertWordProgressEntries(uid: string, entries: WordProgressEntry[]) {
  const rows = await readTable("word_progress.csv", wordProgressHeaders);
  const retained = rows.filter((row) => !(row.uid === uid && entries.some((entry) => entry.word === row.word)));

  const nextRows = [
    ...retained,
    ...entries.map((entry) => ({
      uid,
      word: entry.word,
      status: entry.status,
      reviewedAt: entry.reviewedAt,
    })),
  ];

  await writeTable("word_progress.csv", wordProgressHeaders, nextRows);
  return listWordProgressByUser(uid);
}
