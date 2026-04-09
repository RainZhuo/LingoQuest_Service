import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { z } from "zod";
import { env } from "./config.js";
import { logger } from "./lib/logger.js";
import { fail, ok } from "./lib/http.js";
import { verifyBearerToken } from "./lib/auth.js";
import { getOrCreateProfile, touchProfile } from "./services/profileService.js";
import { generateContent, chatCompletion } from "./lib/ai.js";
import { parseLessonResponse } from "./lib/lesson.js";
import { completeLesson } from "./services/progressService.js";
import { listWordProgress, upsertWordProgress } from "./services/wordProgressService.js";
import type { LessonLevel, TutorMessage } from "./types.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const existing = req.headers["x-request-id"];
      const requestId =
        typeof existing === "string" && existing.trim() ? existing : crypto.randomUUID();
      res.setHeader("x-request-id", requestId);
      return requestId;
    },
  }),
);

app.get("/api/health", (_req, res) => {
  return ok(res, {
    status: "ok",
    service: "lingoquest-service",
    timestamp: new Date().toISOString(),
  });
});

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = await verifyBearerToken(req.header("authorization") ?? undefined);
    (req as Request & { auth?: typeof auth }).auth = auth;
    await touchProfile(auth).catch(() => undefined);
    next();
  } catch (error) {
    req.log?.warn({ error }, "auth_failed");
    fail(res, 401, "UNAUTHORIZED", error instanceof Error ? error.message : "Unauthorized");
  }
}

function getAuth(req: Request) {
  const auth = (req as Request & { auth?: Awaited<ReturnType<typeof verifyBearerToken>> }).auth;
  if (!auth) {
    throw new Error("Missing auth context.");
  }

  return auth;
}

app.get("/api/users/me", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const profile = await getOrCreateProfile(auth);
  return ok(res, { profile });
});

app.post("/api/lessons/generate", requireAuth, async (req, res) => {
  const schema = z.object({
    topic: z.string().trim().min(1),
    learnerLevel: z.enum(["beginner", "intermediate", "advanced"]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, "VALIDATION_ERROR", "Request body is invalid.", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const prompt = `Create a short English lesson about "${parsed.data.topic}" for a "${parsed.data.learnerLevel}" level student.
Include:
1. A short dialogue (3-4 exchanges).
2. 3 key vocabulary words with definitions.
3. A simple grammar point explanation.
Format the output as JSON with keys: title, dialogue, vocabulary, grammar.
Each dialogue item must contain speaker and text.
Each vocabulary item must contain word and definition.
Do not include markdown fences.`;

    const raw = await generateContent(prompt);
    const lesson = parseLessonResponse(raw, parsed.data.topic, parsed.data.learnerLevel);

    return ok(res, { lesson });
  } catch (error) {
    req.log?.error({ error }, "lesson_generation_failed");
    return fail(
      res,
      502,
      "AI_RESPONSE_INVALID",
      error instanceof Error ? error.message : "Lesson could not be generated.",
    );
  }
});

app.post("/api/chat/tutor", requireAuth, async (req, res) => {
  const schema = z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          text: z.string().trim().min(1),
        }),
      )
      .min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, "VALIDATION_ERROR", "Request body is invalid.", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const reply = await chatCompletion(parsed.data.messages as TutorMessage[]);
    return ok(res, reply);
  } catch (error) {
    req.log?.error({ error }, "chat_failed");
    return fail(
      res,
      502,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Tutor chat failed.",
    );
  }
});

app.post("/api/progress/lessons/complete", requireAuth, async (req, res) => {
  const schema = z.object({
    lessonId: z.string().trim().min(1),
    topic: z.string().trim().min(1).nullable().optional(),
    learnerLevel: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
    score: z.number().min(0).max(100).nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, "VALIDATION_ERROR", "Request body is invalid.", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await completeLesson({
      auth: getAuth(req),
      lessonId: parsed.data.lessonId,
      topic: parsed.data.topic ?? null,
      learnerLevel: (parsed.data.learnerLevel ?? null) as LessonLevel | null,
      score: parsed.data.score ?? null,
    });

    return ok(res, result);
  } catch (error) {
    req.log?.error({ error }, "progress_completion_failed");
    return fail(
      res,
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Progress update failed.",
    );
  }
});

app.get("/api/words/progress", requireAuth, async (req, res) => {
  try {
    const entries = await listWordProgress(getAuth(req));
    return ok(res, { entries });
  } catch (error) {
    req.log?.error({ error }, "word_progress_list_failed");
    return fail(
      res,
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Word progress could not be loaded.",
    );
  }
});

app.put("/api/words/progress", requireAuth, async (req, res) => {
  const schema = z.object({
    entries: z.array(
      z.object({
        word: z.string().trim().min(1),
        status: z.enum(["new", "review", "known"]),
        reviewedAt: z.string().trim().min(1),
      }),
    ).min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, "VALIDATION_ERROR", "Request body is invalid.", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const entries = await upsertWordProgress(getAuth(req), parsed.data.entries);
    return ok(res, { entries });
  } catch (error) {
    req.log?.error({ error }, "word_progress_update_failed");
    return fail(
      res,
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Word progress could not be saved.",
    );
  }
});

app.use((_req, res) => {
  return fail(res, 404, "NOT_FOUND", "Route not found.", undefined, String(res.getHeader("x-request-id") ?? ""));
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ error }, "unhandled_error");
  return fail(
    res,
    500,
    "INTERNAL_ERROR",
    error instanceof Error ? error.message : "Internal server error.",
    undefined,
    typeof req.id === "string" ? req.id : String(req.id ?? ""),
  );
});

export default app;
