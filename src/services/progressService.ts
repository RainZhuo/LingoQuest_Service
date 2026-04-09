import { db } from "../lib/firebase.js";
import type { AuthContext } from "../lib/auth.js";
import type { LessonCompletionResult, LessonLevel } from "../types.js";

const memoryState = new Map<
  string,
  {
    xp: number;
    streak: number;
    completions: Set<string>;
  }
>();

function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export async function completeLesson(params: {
  auth: AuthContext;
  lessonId: string;
  topic: string | null;
  learnerLevel: LessonLevel | null;
  score: number | null;
}): Promise<LessonCompletionResult> {
  if (!db) {
    const now = new Date().toISOString();
    const state = memoryState.get(params.auth.uid) ?? {
      xp: 0,
      streak: 0,
      completions: new Set<string>(),
    };
    const duplicate = state.completions.has(params.lessonId);
    const awardedXp = duplicate ? 0 : 50;
    const nextXp = state.xp + awardedXp;
    const nextStreak = duplicate ? state.streak : state.streak + 1;
    const nextLevel = levelFromXp(nextXp);

    if (!duplicate) {
      state.completions.add(params.lessonId);
    }

    state.xp = nextXp;
    state.streak = nextStreak;
    memoryState.set(params.auth.uid, state);

    return {
      progress: {
        lessonId: params.lessonId,
        completed: true,
        awardedXp,
        wasDuplicate: duplicate,
        completedAt: now,
      },
      user: {
        uid: params.auth.uid,
        level: nextLevel,
        xp: nextXp,
        streak: nextStreak,
        lastActiveAt: now,
      },
    };
  }

  const userRef = db.collection("users").doc(params.auth.uid);
  const progressRef = userRef.collection("progress").doc(params.lessonId);

  return db.runTransaction(async (tx) => {
    const [userSnap, progressSnap] = await Promise.all([tx.get(userRef), tx.get(progressRef)]);

    const now = new Date().toISOString();
    const currentXp = Number(userSnap.exists ? userSnap.data()?.xp ?? 0 : 0);
    const currentStreak = Number(userSnap.exists ? userSnap.data()?.streak ?? 0 : 0);
    const duplicate = progressSnap.exists;
    const awardedXp = duplicate ? 0 : 50;

    const nextXp = currentXp + awardedXp;
    const nextLevel = levelFromXp(nextXp);
    const nextStreak = duplicate ? currentStreak : currentStreak + 1;

    tx.set(
      userRef,
      {
        uid: params.auth.uid,
        email: params.auth.email,
        displayName: params.auth.displayName,
        photoURL: params.auth.photoURL,
        xp: nextXp,
        level: nextLevel,
        streak: nextStreak,
        lastActiveAt: now,
      },
      { merge: true },
    );

    if (!duplicate) {
      tx.set(progressRef, {
        lessonId: params.lessonId,
        uid: params.auth.uid,
        topic: params.topic,
        learnerLevel: params.learnerLevel,
        score: params.score,
        awardedXp,
        completed: true,
        completedAt: now,
      });
    }

    return {
      progress: {
        lessonId: params.lessonId,
        completed: true,
        awardedXp,
        wasDuplicate: duplicate,
        completedAt: now,
      },
      user: {
        uid: params.auth.uid,
        level: nextLevel,
        xp: nextXp,
        streak: nextStreak,
        lastActiveAt: now,
      },
    };
  });
}
