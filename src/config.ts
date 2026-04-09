import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  GOOGLE_GENAI_API_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIRESTORE_DATABASE_ID: z.string().default("(default)"),
  ALLOW_MOCK_AUTH: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  isDevelopment: parsed.NODE_ENV === "development",
};
