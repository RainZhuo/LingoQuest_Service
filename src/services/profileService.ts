import { db } from "../lib/firebase.js";
import type { AuthContext } from "../lib/auth.js";
import type { UserProfile } from "../types.js";
import { getUserProfile, upsertUserProfile } from "./userTableService.js";

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

export async function getOrCreateProfile(auth: AuthContext): Promise<UserProfile> {
  if (!db) {
    const existing = await getUserProfile(auth.uid);
    if (existing) {
      const merged = {
        ...existing,
        email: auth.email,
        displayName: auth.displayName,
        photoURL: auth.photoURL,
      };
      await upsertUserProfile(merged);
      return merged;
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: auth.uid,
      email: auth.email,
      displayName: auth.displayName,
      photoURL: auth.photoURL,
      level: 1,
      xp: 0,
      streak: 0,
      createdAt: now,
      lastActiveAt: now,
    };
    await upsertUserProfile(profile);
    return profile;
  }

  const ref = db.collection("users").doc(auth.uid);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    const data = snapshot.data() as Partial<UserProfile> & {
      createdAt?: unknown;
      lastActiveAt?: unknown;
    };

    return {
      uid: auth.uid,
      email: auth.email,
      displayName: auth.displayName,
      photoURL: auth.photoURL,
      level: Number(data.level ?? 1),
      xp: Number(data.xp ?? 0),
      streak: Number(data.streak ?? 0),
      createdAt: toIso(data.createdAt),
      lastActiveAt: toIso(data.lastActiveAt),
    };
  }

  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: auth.uid,
    email: auth.email,
    displayName: auth.displayName,
    photoURL: auth.photoURL,
    level: 1,
    xp: 0,
    streak: 0,
    createdAt: now,
    lastActiveAt: now,
  };

  await ref.set(profile);
  return profile;
}

export async function touchProfile(auth: AuthContext) {
  if (!db) {
    const existing = await getOrCreateProfile(auth);
    await upsertUserProfile({
      ...existing,
      email: auth.email,
      displayName: auth.displayName,
      photoURL: auth.photoURL,
      lastActiveAt: new Date().toISOString(),
    });
    return;
  }

  const ref = db.collection("users").doc(auth.uid);
  await ref.set(
    {
      uid: auth.uid,
      email: auth.email,
      displayName: auth.displayName,
      photoURL: auth.photoURL,
      lastActiveAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
