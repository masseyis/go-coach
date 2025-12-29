import type { GoCoachRequest, GoCoachResponse } from "../types/go";
import { GO_COACH_PROMPT } from "./goPrompts";

const API_URL = import.meta.env.VITE_OPENAI_API_BASE?.trim() || "https://api.openai.com/v1/chat/completions";
const MODEL = import.meta.env.VITE_OPENAI_MODEL?.trim() || "gpt-4.1-mini";

export async function getGoFeedback(input: GoCoachRequest, apiKey: string): Promise<GoCoachResponse> {
  if (!apiKey) {
    throw new Error("Missing OpenAI API key");
  }

  const payload = {
    model: MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: GO_COACH_PROMPT },
      { role: "user", content: `Here is the current position: ${JSON.stringify(input)}` },
    ],
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI API returned no content");
  }

  return JSON.parse(content) as GoCoachResponse;
}
