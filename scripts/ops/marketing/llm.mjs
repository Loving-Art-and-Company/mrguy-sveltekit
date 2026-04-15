import { loadLocalEnv } from '../env.mjs';

loadLocalEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

export async function chatCompletion({
  system,
  user,
  model = 'gemini-2.0-flash',
  temperature = 0.7,
  jsonMode = false,
}) {
  if (!GEMINI_API_KEY) {
    return {
      ok: false,
      status: 'unconfigured',
      reason: 'GEMINI_API_KEY is not set.',
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    systemInstruction: {
      parts: [{ text: system }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: user }],
      },
    ],
    generationConfig: {
      temperature,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: 'failed',
        reason: data?.error?.message ?? `Gemini error ${response.status}`,
      };
    }

    if (data.promptFeedback?.blockReason) {
      return {
        ok: false,
        status: 'blocked',
        reason: `Gemini blocked: ${data.promptFeedback.blockReason}`,
      };
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return {
      ok: true,
      status: 'ok',
      content,
      usage: data.usageMetadata ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
