import { db } from "../lib/firebase.js";
import type { AuthContext } from "../lib/auth.js";
import type { WordProgressEntry, WordProgressStatus } from "../types.js";

const memoryWordProgress = new Map<string, Map<string, WordProgressEntry>>();

function toIso(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

export async function listWordProgress(auth: AuthContext) {
  if (!db) {
    return Array.from(memoryWordProgress.get(auth.uid)?.values() ?? []);
  }

  const snapshot = await db.collection("users").doc(auth.uid).collection("wordProgress").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Partial<WordProgressEntry> & { reviewedAt?: unknown };
    return {
      word: doc.id,
      status: (data.status ?? "new") as WordProgressStatus,
      reviewedAt: toIso(data.reviewedAt),
    };
  });
}

export async function upsertWordProgress(auth: AuthContext, entries: WordProgressEntry[]) {
  if (!db) {
    const userMap = memoryWordProgress.get(auth.uid) ?? new Map<string, WordProgressEntry>();
    for (const entry of entries) {
      userMap.set(entry.word, entry);
    }
    memoryWordProgress.set(auth.uid, userMap);
    return Array.from(userMap.values());
  }

  const batch = db.batch();
  const progressCollection = db.collection("users").doc(auth.uid).collection("wordProgress");

  for (const entry of entries) {
    const ref = progressCollection.doc(entry.word);
    batch.set(
      ref,
      {
        word: entry.word,
        status: entry.status,
        reviewedAt: entry.reviewedAt,
      },
      { merge: true },
    );
  }

  await batch.commit();
  return listWordProgress(auth);
}
