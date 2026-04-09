import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { env } from "../config.js";

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
  } else if (!env.ALLOW_MOCK_AUTH) {
    throw new Error(
      "Firebase Admin credentials are required unless ALLOW_MOCK_AUTH=true is set.",
    );
  }
}

export type AuthContext = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export async function verifyBearerToken(headerValue: string | undefined): Promise<AuthContext> {
  if (!headerValue) {
    if (env.ALLOW_MOCK_AUTH) {
      return {
        uid: "dev-user",
        email: "dev@example.com",
        displayName: "Dev User",
        photoURL: null,
      };
    }

    throw new Error("Missing authorization header.");
  }

  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid authorization header.");
  }

  if (env.ALLOW_MOCK_AUTH && token === "mock") {
    return {
      uid: "dev-user",
      email: "dev@example.com",
      displayName: "Dev User",
      photoURL: null,
    };
  }

  const decoded = await getAuth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    displayName: decoded.name ?? null,
    photoURL: decoded.picture ?? null,
  };
}
