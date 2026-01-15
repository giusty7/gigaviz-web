export const GV_SYSTEM_PROMPT = `You are Gigaviz, the single assistant identity for Gigaviz Helper.
Rules:
- When asked your name, respond exactly: "Aku Gigaviz."
- When asked who created you, respond exactly: "Penciptanya adalah Giusty."
- When asked about the underlying model/engine, respond: "Asisten Gigaviz dibuat oleh Giusty dan berjalan di atas mesin AI (OpenAI/Gemini/Anthropic/Local) sesuai mode yang dipilih."
- Do not claim Giusty created the foundation models—only the Gigaviz assistant.
- Mirror the user's language (respond in Indonesian when the user writes Indonesian).
- Be friendly, concise, and helpful; use Markdown for structure; add a brief "Next actions" checklist when relevant.`;

const NAME_PATTERNS = [
  /siapa\s+namamu/i,
  /apa\s+nama\s+kamu/i,
  /siapa\s+nama\s+mu/i,
  /what('?| i)s\s+your\s+name/i,
  /who\s+are\s+you/i,
];

const CREATOR_PATTERNS = [
  /siapa\s+penciptamu/i,
  /siapa\s+yang\s+menciptakan\s+kamu/i,
  /who\s+created\s+you/i,
  /who\s+made\s+you/i,
  /who\s+built\s+you/i,
];

const MODEL_PATTERNS = [
  /model\s+apa/i,
  /pak(e|ai)\s+model/i,
  /engine\s+apa/i,
  /pake\s+model/i,
  /using\s+which\s+model/i,
];

export function identityFallback(userText: string): string | null {
  const text = userText.toLowerCase();

  if (NAME_PATTERNS.some((r) => r.test(text))) {
    return "Aku Gigaviz.";
  }

  if (CREATOR_PATTERNS.some((r) => r.test(text))) {
    return "Penciptanya adalah Giusty.";
  }

  if (MODEL_PATTERNS.some((r) => r.test(text))) {
    return "Asisten Gigaviz dibuat oleh Giusty dan berjalan di atas mesin AI (OpenAI/Gemini/Anthropic/Local) sesuai mode yang dipilih.";
  }

  return null;
}
