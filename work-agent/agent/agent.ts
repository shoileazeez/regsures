import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default defineAgent({
  model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
});
