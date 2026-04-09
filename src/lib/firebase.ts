import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "../config.js";

let firebaseEnabled = false;

if (!getApps().length) {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      projectId: env.FIREBASE_PROJECT_ID,
    });
    firebaseEnabled = true;
  } else if (getApps().length) {
    firebaseEnabled = true;
  }
} else {
  firebaseEnabled = true;
}

export const db = firebaseEnabled ? getFirestore() : null;

export function hasFirestore() {
  return db !== null;
}
