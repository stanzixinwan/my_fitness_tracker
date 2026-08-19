import { getLlmStatus } from "@/lib/llm/config";

export type LlmImage = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
};

export type JsonCompletionInput = {
  system: string;
  prompt: string;
  images?: LlmImage[];
};

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function parseJsonContent(text: string) {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    throw new Error("LLM returned content that was not valid JSON");
  }
}

async function completeWithGemini(input: JsonCompletionInput) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const baseUrl =
    process.env.GEMINI_BASE_URL?.trim() ||
    "https://generativelanguage.googleapis.com/v1beta";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const parts: Array<Record<string, unknown>> = [
    { text: `${input.system}\n\n${input.prompt}` },
  ];

  for (const image of input.images ?? []) {
    parts.push({
      inline_data: {
        mime_type: image.mimeType,
        data: image.base64,
      },
    });
  }

  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  const payload = (await response.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Gemini request failed with status ${response.status}`);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini response did not include content");
  }

  return parseJsonContent(text);
}

async function completeWithOpenAi(input: JsonCompletionInput) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const baseUrl = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const userContent: Array<Record<string, unknown>> = [
    { type: "text", text: input.prompt },
  ];

  for (const image of input.images ?? []) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${image.mimeType};base64,${image.base64}`,
      },
    });
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: userContent },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `LLM request failed with status ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM response did not include content");
  }

  return parseJsonContent(content);
}

export async function completeJson(input: JsonCompletionInput) {
  const status = getLlmStatus();

  if (status.provider === "gemini") {
    return completeWithGemini(input);
  }

  if (status.provider === "openai") {
    return completeWithOpenAi(input);
  }

  throw new Error("No remote LLM is configured. Set GEMINI_API_KEY or OPENAI_API_KEY.");
}
