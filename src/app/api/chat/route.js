import { NextResponse } from 'next/server';

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-3-flash-preview";
const FALLBACK_MODEL = "google/gemini-2.0-flash-exp:free";

async function callOpenRouter(model, messages, apiKey) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://douzhidao.vercel.app',
      'X-Title': 'DouZhidao'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    let data;
    try {
      // Attempt 1: Primary Model
      console.log(`Trying Primary Model: ${PRIMARY_MODEL}`);
      data = await callOpenRouter(PRIMARY_MODEL, messages, API_KEY);
    } catch (primaryError) {
      console.warn(`Primary Model failed: ${primaryError.message}. Switching to Fallback...`);
      // Attempt 2: Fallback Model
      try {
        console.log(`Trying Fallback Model: ${FALLBACK_MODEL}`);
        data = await callOpenRouter(FALLBACK_MODEL, messages, API_KEY);
      } catch (fallbackError) {
        console.error("Fallback Model also failed:", fallbackError);
        throw fallbackError; // Both failed
      }
    }

    const aiContent = data.choices[0].message.content;
    return NextResponse.json({ content: aiContent });

  } catch (error) {
    console.error("Final API Error:", error);
    return NextResponse.json({ error: 'AI Service Temporarily Unavailable' }, { status: 500 });
  }
}
