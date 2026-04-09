import type { Lesson, LessonLevel } from "../types.js";

function cleanJsonText(text: string) {
  return text.replace(/```json\s*|\s*```/g, "").trim();
}

function extractJsonObject(text: string) {
  const cleaned = cleanJsonText(text);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

export function parseLessonResponse(text: string, topic: string, level: LessonLevel): Lesson {
  const cleaned = extractJsonObject(text);
  const parsed = JSON.parse(cleaned) as Partial<Lesson> & {
    ["1"]?: unknown;
    ["2"]?: unknown;
    ["3"]?: unknown;
    dialogue?: unknown;
    vocabulary?: unknown;
    grammar?: unknown;
  };

  const dialogue = Array.isArray(parsed.dialogue)
    ? parsed.dialogue
    : Array.isArray(parsed["1"])
      ? parsed["1"]
      : [];
  const vocabulary = Array.isArray(parsed.vocabulary)
    ? parsed.vocabulary
    : Array.isArray(parsed["2"])
      ? parsed["2"]
      : [];
  const grammarValue = typeof parsed.grammar === "string" ? parsed.grammar : parsed["3"];

  const normalizedDialogue = dialogue
    .map((item, index) => ({
      speaker:
        typeof item === "object" && item !== null && "speaker" in item
          ? String((item as { speaker?: unknown }).speaker ?? "").trim()
          : `Speaker ${index + 1}`,
      text:
        typeof item === "object" && item !== null && "text" in item
          ? String((item as { text?: unknown }).text ?? "").trim()
          : typeof item === "object" && item !== null && "line" in item
            ? String((item as { line?: unknown }).line ?? "").trim()
            : "",
    }))
    .filter((item) => item.text);

  const normalizedVocabulary = vocabulary
    .map((item) => ({
      word:
        typeof item === "object" && item !== null && "word" in item
          ? String((item as { word?: unknown }).word ?? "").trim()
          : "",
      definition:
        typeof item === "object" && item !== null && "definition" in item
          ? String((item as { definition?: unknown }).definition ?? "").trim()
          : typeof item === "object" && item !== null && "meaning" in item
            ? String((item as { meaning?: unknown }).meaning ?? "").trim()
            : "",
    }))
    .filter((item) => item.word && item.definition);

  return {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title : `Lesson about ${topic}`,
    level,
    dialogue:
      normalizedDialogue.length > 0
        ? normalizedDialogue
        : [
            { speaker: "Tutor", text: `Let's talk about ${topic}.` },
            { speaker: "Learner", text: `I want to practice ${topic.toLowerCase()}.` },
          ],
    vocabulary:
      normalizedVocabulary.length > 0
        ? normalizedVocabulary
        : [
            { word: topic, definition: `A key word related to ${topic.toLowerCase()}.` },
          ],
    grammar: typeof grammarValue === "string" && grammarValue.trim() ? grammarValue : "Grammar point not available.",
  };
}
