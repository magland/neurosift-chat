import { NextResponse } from 'next/server';

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const allowedModels = [
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1",
  "anthropic/claude-sonnet-4"
]

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userKey = request.headers.get('x-openrouter-key');
    const isAllowedModel = allowedModels.includes(body.model);

    // For non-cheap models, require user's key
    if (!isAllowedModel && !userKey) {
      return NextResponse.json(
        { error: 'OpenRouter key required for model' + body.model },
        { status: 400 }
      );
    }

    // Use user key if provided, otherwise fall back to environment variable (for gemini)
    const apiKey = userKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const messages = body.messages;
    const firstMessage = messages[0];
    if (firstMessage.role !== "system") {
      return NextResponse.json({ error: 'First message must be a system message' }, { status: 400 });
    }
    const firstMessageContent: string = firstMessage.content;
    if (!firstMessageContent.toLowerCase().includes("neurosift-chat")) {
      return NextResponse.json({ error: 'First message must contain neurosift-chat' }, { status: 400 });
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: response.statusText }, { status: response.status });
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
