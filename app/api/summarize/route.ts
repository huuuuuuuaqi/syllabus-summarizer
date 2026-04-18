import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

/** Prefer dated snapshot IDs; aliases like `claude-sonnet-4-5` can fail depending on API/account. */
const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT =
  "You are a helpful assistant for university students. Summarize the syllabus into these sections: Course Overview (2-3 sentences), Key Dates (bullet list), Grading Breakdown (bullet list), Weekly Workload estimate, and Professor Contact Info.";

function textFromContent(
  content: Anthropic.Message["content"],
): string {
  return content
    .filter(
      (block): block is Anthropic.TextBlock => block.type === "text",
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("syllabus" in body) ||
    typeof (body as { syllabus: unknown }).syllabus !== "string"
  ) {
    return NextResponse.json(
      { error: 'Request body must be a JSON object with a string "syllabus" field' },
      { status: 400 },
    );
  }

  const syllabus = (body as { syllabus: string }).syllabus.trim();
  if (!syllabus) {
    return NextResponse.json(
      { error: '"syllabus" must be a non-empty string' },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Summarization is not configured on the server." },
      { status: 500 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: syllabus }],
    });

    const summary = textFromContent(message.content);
    if (!summary) {
      return NextResponse.json(
        { error: "The model returned an empty summary." },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[api/summarize]", err);

    if (err instanceof APIError) {
      if (err.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please wait and try again." },
          { status: 429 },
        );
      }
      if (err.status === 401 || err.status === 403) {
        return NextResponse.json(
          { error: "Summarization is not configured correctly on the server." },
          { status: 500 },
        );
      }
      const detail = err.message?.trim();
      return NextResponse.json(
        {
          error: detail
            ? `Failed to generate a summary: ${detail}`
            : "Failed to generate a summary. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
