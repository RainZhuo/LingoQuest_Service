import http from "node:http";

const PORT = Number(process.env.PORT || 8080);

const users = new Map();
const progressByUser = new Map();

function now() {
  return new Date().toISOString();
}

function getUser() {
  const uid = "dev-user";
  let user = users.get(uid);

  if (!user) {
    user = {
      uid,
      email: "dev@example.com",
      displayName: "Dev User",
      photoURL: null,
      level: 1,
      xp: 0,
      streak: 0,
      createdAt: now(),
      lastActiveAt: now(),
    };
    users.set(uid, user);
  }

  user.lastActiveAt = now();
  return user;
}

function ok(res, data, status = 200) {
  const payload = JSON.stringify({ success: true, data });
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
}

function fail(res, status, code, message, details) {
  const payload = JSON.stringify({
    success: false,
    error: {
      code,
      message,
      details,
      requestId: crypto.randomUUID(),
    },
  });
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function levelFromXp(xp) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function mockLesson(topic, learnerLevel) {
  return {
    title: `${topic} Conversation Practice`,
    level: learnerLevel,
    dialogue: [
      { speaker: "Tutor", text: `Today we will practice English about ${topic.toLowerCase()}.` },
      { speaker: "Learner", text: `Great, I want to improve my confidence with ${topic.toLowerCase()}.` },
      { speaker: "Tutor", text: "Try answering in full sentences and keep your ideas simple." },
      { speaker: "Learner", text: "Okay, I will try my best." },
    ],
    vocabulary: [
      { word: topic, definition: `A topic related to ${topic.toLowerCase()}.` },
      { word: "confident", definition: "feeling sure that you can do something well" },
      { word: "practice", definition: "to do something again to improve your skill" },
    ],
    grammar: "Use the future form with 'will' to talk about what you plan to do.",
  };
}

function mockTutorReply(messages) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.text ?? "";
  return {
    reply: `Mock tutor: I understand "${lastUserMessage}". Add one more sentence with a little more detail.`,
    corrections: [],
    suggestions: ["Mention where it happened.", "Add one feeling word."],
  };
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    return fail(res, 400, "BAD_REQUEST", "Invalid request.");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  if (req.url === "/api/health" && req.method === "GET") {
    return ok(res, {
      status: "ok",
      service: "lingoquest-service-mock",
      timestamp: now(),
    });
  }

  if (req.headers.authorization !== "Bearer mock") {
    return fail(res, 401, "UNAUTHORIZED", "Mock test environment requires Authorization: Bearer mock");
  }

  if (req.url === "/api/users/me" && req.method === "GET") {
    return ok(res, { profile: getUser() });
  }

  if (req.url === "/api/lessons/generate" && req.method === "POST") {
    const body = await readJson(req).catch(() => null);
    if (!body || typeof body.topic !== "string" || typeof body.learnerLevel !== "string") {
      return fail(res, 400, "VALIDATION_ERROR", "Request body is invalid.");
    }

    return ok(res, {
      lesson: mockLesson(body.topic, body.learnerLevel),
    });
  }

  if (req.url === "/api/chat/tutor" && req.method === "POST") {
    const body = await readJson(req).catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return fail(res, 400, "VALIDATION_ERROR", "Request body is invalid.");
    }

    return ok(res, mockTutorReply(body.messages));
  }

  if (req.url === "/api/progress/lessons/complete" && req.method === "POST") {
    const body = await readJson(req).catch(() => null);
    if (!body || typeof body.lessonId !== "string") {
      return fail(res, 400, "VALIDATION_ERROR", "Request body is invalid.");
    }

    const user = getUser();
    const completions = progressByUser.get(user.uid) ?? new Set();
    const duplicate = completions.has(body.lessonId);
    const awardedXp = duplicate ? 0 : 50;

    if (!duplicate) {
      completions.add(body.lessonId);
      progressByUser.set(user.uid, completions);
      user.xp += awardedXp;
      user.streak += 1;
      user.level = levelFromXp(user.xp);
      user.lastActiveAt = now();
      users.set(user.uid, user);
    }

    return ok(res, {
      progress: {
        lessonId: body.lessonId,
        completed: true,
        awardedXp,
        wasDuplicate: duplicate,
        completedAt: now(),
      },
      user,
    });
  }

  return fail(res, 404, "NOT_FOUND", "Route not found.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`LingoQuest mock service listening on http://0.0.0.0:${PORT}`);
});
