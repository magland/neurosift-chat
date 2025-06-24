import { NextResponse } from 'next/server';
import { UsageService } from '../../../lib/usageService';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const allowedModels = [
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1",
  "anthropic/claude-sonnet-4"
]

// Model costs per million tokens (prompt, completion)
const MODEL_COSTS = {
  'anthropic/claude-sonnet-4': { prompt: 3, completion: 15 },
  'openai/gpt-4.1': { prompt: 2, completion: 8 },
  'openai/gpt-4.1-mini': { prompt: 0.4, completion: 1.6 },
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userKey = request.headers.get('x-openrouter-key');
    const isAllowedModel = allowedModels.includes(body.model);
    const model = body.model;

    // For non-cheap models, require user's key
    if (!isAllowedModel && !userKey) {
      return NextResponse.json(
        { error: 'OpenRouter key required for model' + body.model },
        { status: 400 }
      );
    }

    // Check usage limits for tracked models when no user key is provided
    if (UsageService.isTrackedModel(model) && !userKey) {
      const canMakeRequest = await UsageService.canMakeRequest(model, 'public');
      if (!canMakeRequest) {
        return NextResponse.json(
          {
            error: `Daily quota exceeded for ${model}. Please select a different model or provide your own OpenRouter key.`,
            quotaExceeded: true
          },
          { status: 429 }
        );
      }
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

    // Track usage for tracked models
    if (UsageService.isTrackedModel(model)) {
      try {
        const usage = result.usage;
        if (usage && usage.prompt_tokens && usage.completion_tokens) {
          const costs = MODEL_COSTS[model];
          const cost = (costs.prompt * usage.prompt_tokens + costs.completion * usage.completion_tokens) / 1_000_000;

          const usageType = userKey ? 'userKey' : 'public';
          await UsageService.updateUsage(model, usageType, cost);
        }
      } catch (usageError) {
        console.error('Error updating usage:', usageError);
        // Don't fail the request if usage tracking fails
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
