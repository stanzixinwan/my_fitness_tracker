export type LlmProviderKind = "gemini" | "openai" | "local";

export type LlmStatus = {
  provider: LlmProviderKind;
  model: string;
  supportsVision: boolean;
};

export function getLlmStatus(): LlmStatus {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return {
      provider: "gemini",
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
      supportsVision: true,
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      provider: "openai",
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      supportsVision: true,
    };
  }

  return {
    provider: "local",
    model: "local-rule-provider",
    supportsVision: false,
  };
}

export function requireVisionLlm() {
  const status = getLlmStatus();

  if (!status.supportsVision) {
    throw new Error(
      "Photo scan needs a vision LLM. Set GEMINI_API_KEY or OPENAI_API_KEY in .env, then restart the dev server.",
    );
  }

  return status;
}
