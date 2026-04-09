import { db } from "../lib/firebase.js";
import type { AuthContext } from "../lib/auth.js";
import type { WordProgressEntry, WordProgressStatus } from "../types.js";
import { listWordProgressByUser, upsertWordProgressEntries } from "./userTableService.js";

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
    return listWordProgressByUser(auth.uid);
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
    return upsertWordProgressEntries(auth.uid, entries);
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
