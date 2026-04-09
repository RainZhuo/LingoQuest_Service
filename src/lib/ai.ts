import { GoogleGenAI } from "@google/genai";
import { env } from "../config.js";
import type { TutorMessage, TutorReply } from "../types.js";

const apiKey = env.GOOGLE_GENAI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const lessonModel = "gemini-2.0-flash";
const tutorModel = "gemini-2.0-flash";

export function hasAiClient() {
  return ai !== null;
}

function extractTopicFromPrompt(prompt: string) {
  const match = prompt.match(/about "([^"]+)"/i);
  return match?.[1]?.trim() || "daily English";
}

function toScenarioTitle(topic: string) {
  const [scene] = topic.split(" - ");
  return scene.trim();
}

function buildScenarioDialogue(topic: string) {
  const sceneTitle = toScenarioTitle(topic);
  const normalized = sceneTitle.toLowerCase();

  if (/hotel|入住|旅馆|酒店/.test(sceneTitle)) {
    return {
      title: "Hotel Check-in",
      dialogue: [
        { speaker: "Receptionist", text: "Welcome to the hotel. Are you checking in tonight?" },
        { speaker: "Guest", text: "Yes, I have a reservation under Lee." },
        { speaker: "Receptionist", text: "Great. Could you show me your passport, please?" },
        { speaker: "Guest", text: "Sure. Here it is." },
      ],
      vocabulary: [
        { word: "reservation", definition: "a booking made in advance for a room or service" },
        { word: "check in", definition: "to arrive and complete the entry process at a hotel" },
        { word: "passport", definition: "an official travel document that proves your identity" },
      ],
      grammar: "Use 'I have a reservation under...' to clearly tell hotel staff whose name the booking is under.",
    };
  }

  if (/restaurant|点餐|餐厅|coffee|cafe|food|meal/.test(normalized)) {
    return {
      title: "Ordering Food",
      dialogue: [
        { speaker: "Server", text: "Hi there. What would you like to order today?" },
        { speaker: "Customer", text: "I'd like a chicken sandwich and a coffee, please." },
        { speaker: "Server", text: "Sure. Would you like anything else?" },
        { speaker: "Customer", text: "No, that's all. Thank you." },
      ],
      vocabulary: [
        { word: "order", definition: "to ask for food or drink in a restaurant or cafe" },
        { word: "anything else", definition: "a common follow-up question asking if you want more items" },
        { word: "that's all", definition: "a polite way to say you do not want anything more" },
      ],
      grammar: "Use 'I'd like...' for polite ordering when you want to ask for food or drinks.",
    };
  }

  if (/direction|问路|airport|station|travel|bus|subway|taxi/.test(normalized)) {
    return {
      title: "Asking for Directions",
      dialogue: [
        { speaker: "Local", text: "You look a little lost. Where are you trying to go?" },
        { speaker: "Traveler", text: "I'm trying to get to the train station." },
        { speaker: "Local", text: "Go straight for two blocks and turn left at the bank." },
        { speaker: "Traveler", text: "Got it. Thank you for your help." },
      ],
      vocabulary: [
        { word: "train station", definition: "the place where trains arrive and leave" },
        { word: "go straight", definition: "continue forward without turning" },
        { word: "turn left", definition: "move in the direction on your left side" },
      ],
      grammar: "Use 'I'm trying to...' to explain your immediate goal when asking for help in a place.",
    };
  }

  return {
    title: sceneTitle,
    dialogue: [
      { speaker: "Partner", text: `Let's practice the scene about ${sceneTitle}. What do you need to say first here?` },
      { speaker: "Learner", text: `I want to talk about ${sceneTitle.toLowerCase()} clearly.` },
      { speaker: "Partner", text: "Good. Say your main need first, and then add one key detail." },
      { speaker: "Learner", text: "Sure. I'll explain it step by step." },
    ],
    vocabulary: [
      { word: "main need", definition: "the most important thing you want to express first" },
      { word: "detail", definition: "extra information that makes your meaning clearer" },
      { word: "step by step", definition: "in a clear order, one part at a time" },
    ],
    grammar: `In ${sceneTitle}, start with your main purpose first and then add a useful detail such as time, place, or reason.`,
  };
}

export async function generateContent(prompt: string) {
  if (!ai) {
    return JSON.stringify({
      ...buildScenarioDialogue(extractTopicFromPrompt(prompt)),
      prompt,
    });
  }

  const response = await ai.models.generateContent({
    model: lessonModel,
    contents: prompt,
  });

  return response.text ?? "";
}

function extractJsonBlock(text: string) {
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function normalizeTutorReply(rawText: string): TutorReply {
  try {
    const parsed = JSON.parse(extractJsonBlock(rawText)) as Partial<TutorReply>;
    return {
      reply:
        typeof parsed.reply === "string" && parsed.reply.trim()
          ? parsed.reply.trim()
          : "Let's keep practicing. Tell me a little more.",
      corrections: Array.isArray(parsed.corrections)
        ? parsed.corrections
            .map((item) => ({
              original: String(item?.original ?? "").trim(),
              corrected: String(item?.corrected ?? "").trim(),
              reason: String(item?.reason ?? "").trim(),
            }))
            .filter((item) => item.original && item.corrected && item.reason)
        : undefined,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map((item) => String(item).trim()).filter(Boolean)
        : undefined,
    };
  } catch {
    return {
      reply: rawText.trim() || "Let's keep practicing. Tell me a little more.",
    };
  }
}

function buildFallbackCorrection(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  let corrected = trimmed
    .replace(/\bi am\b/gi, "I am")
    .replace(/\bi m\b/gi, "I'm")
    .replace(/\bi dont\b/gi, "I don't")
    .replace(/\bcant\b/gi, "can't")
    .replace(/\bwanna\b/gi, "want to")
    .replace(/\bgonna\b/gi, "going to");

  corrected = corrected.replace(/\bI very like\b/gi, "I really like");
  corrected = corrected.replace(/\bmore better\b/gi, "better");
  corrected = corrected.replace(/\bvery delicious\b/gi, "really delicious");
  corrected = corrected.replace(/\bhow to say\b/gi, "how do I say");
  corrected = corrected.replace(/\bpeople is\b/gi, "people are");
  corrected = corrected.replace(/\bhe go\b/gi, "he goes");
  corrected = corrected.replace(/\bshe go\b/gi, "she goes");
  corrected = corrected.replace(/\bit have\b/gi, "it has");
  corrected = corrected.replace(/\bI can to\b/gi, "I can");

  if (corrected === trimmed) {
    return [];
  }

  return [
    {
      original: trimmed,
      corrected,
      reason: "把口语里容易不完整或不自然的写法改成更清楚、更标准的表达。",
    },
  ];
}

function buildFallbackSuggestions(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return [
      "先告诉我你想练什么场景，例如点餐、面试或工作汇报。",
      "也可以直接发一句英文，我来帮你改得更自然。",
    ];
  }

  if (/\?$/.test(trimmed)) {
    return [
      "试着补一句你的具体情况，这样回答会更完整。",
      "再加一个时间、地点或目的，让这句话更像真实对话。",
    ];
  }

  return [
    "再补一个细节，比如时间、地点或原因。",
    "把这句话换成更礼貌的说法，再试一次。",
    "现在试着把它说得更短、更自然。",
  ];
}

function buildFallbackReply(messages: TutorMessage[]): TutorReply {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.text ?? "";
  const corrections = buildFallbackCorrection(lastUserMessage);
  const suggestions = buildFallbackSuggestions(lastUserMessage);

  if (!lastUserMessage.trim()) {
    return {
      reply: "告诉我你现在最想练的场景，我会先陪你做一轮低压力开口。",
      corrections,
      suggestions,
    };
  }

  if (/面试|interview/i.test(lastUserMessage)) {
    return {
      reply:
        "这句话已经有核心意思了。面试里建议你先给直接答案，再补一条经历或结果，这样会更像成熟回答。",
      corrections,
      suggestions: [
        "用一句话直接回答问题。",
        "再补一个具体例子。",
        "最后用一句总结你带来的结果。",
      ],
    };
  }

  if (/餐|点餐|restaurant|order|coffee|hotel|check in|travel/i.test(lastUserMessage)) {
    return {
      reply:
        "放在生活场景里，这句话可以更直接一点。先说需求，再说偏好或限制，听起来会更自然。",
      corrections,
      suggestions: [
        "先说明你想要什么。",
        "再补充数量、口味或限制。",
        "最后加一句礼貌收尾。",
      ],
    };
  }

  return {
    reply:
      "你的意思已经出来了。下一步不是说更复杂，而是把句子补完整，再加一个细节，让对方更容易接话。",
    corrections,
    suggestions,
  };
}

export async function chatCompletion(messages: TutorMessage[]): Promise<TutorReply> {
  if (!ai) {
    return buildFallbackReply(messages);
  }

  const transcript = messages
    .map((message) => `${message.role === "assistant" ? "Tutor" : "Learner"}: ${message.text}`)
    .join("\n");

  const prompt = [
    "You are a helpful English tutor for Chinese learners of spoken English.",
    "Reply warmly, concretely, and concisely.",
    "Your goal is to help the learner say one better sentence right now.",
    "Reply mainly in Chinese, but keep corrected English examples in English.",
    "If the learner made a clear grammar or phrasing mistake, include a correction.",
    "Return strict JSON with keys: reply, corrections, suggestions.",
    "corrections must be an array of objects with original, corrected, reason.",
    "suggestions must be an array of short strings.",
    "If there are no corrections or suggestions, return empty arrays.",
    "",
    "Conversation:",
    transcript,
  ].join("\n");

  const response = await ai.models.generateContent({
    model: tutorModel,
    contents: prompt,
  });

  return normalizeTutorReply(response.text ?? "");
}
