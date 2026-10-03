import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { env } from "../../lib/env.ts";
import { AiError } from "../../lib/errors.ts";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// USD per million tokens, for the cost line in the logs. Update if prices change.
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

type Effort = "low" | "medium" | "high";

// The one place the app talks to Claude. Every AI feature (summaries, exams, grading)
// asks for JSON matching a zod schema and gets back a typed, validated object.
export async function generateStructured<S extends z.ZodType>(opts: {
  task: string; // label for logs, e.g. "summarize"
  system: string;
  content: Anthropic.ContentBlockParam[];
  schema: S;
  effort: Effort;
  maxTokens?: number;
}): Promise<{ data: z.infer<S>; model: string }> {
  const started = Date.now();

  // Streaming keeps long requests (big PDFs, 25-question exams) from hitting HTTP
  // timeouts. finalMessage() waits for the whole response, so the code stays simple.
  const stream = anthropic.messages.stream({
    model: env.AI_MODEL,
    max_tokens: opts.maxTokens ?? 32000,
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort, format: zodOutputFormat(opts.schema) },
    system: opts.system,
    messages: [{ role: "user", content: opts.content }],
  });
  const message = await stream.finalMessage();

  logUsage(opts.task, message, Date.now() - started);

  if (message.stop_reason === "refusal") {
    throw new AiError("This content couldn't be processed. Please try different notes.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new AiError("The response was too long and got cut off. Try shorter notes or fewer questions.");
  }
  if (message.parsed_output == null) {
    throw new AiError("The AI returned an unexpected format. Please try again.");
  }
  return { data: message.parsed_output as z.infer<S>, model: message.model };
}

function logUsage(task: string, message: Anthropic.Message, ms: number) {
  const { input_tokens, output_tokens } = message.usage;
  const price = PRICES[message.model];
  const cost = price
    ? ` cost≈$${((input_tokens * price.input + output_tokens * price.output) / 1e6).toFixed(4)}`
    : "";
  console.log(
    `[ai] ${task} model=${message.model} in=${input_tokens} out=${output_tokens}${cost} ` +
      `stop=${message.stop_reason} ${(ms / 1000).toFixed(1)}s`,
  );
}
