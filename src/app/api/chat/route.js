import { NextResponse } from 'next/server';

export const runtime = 'edge';

const API_KEY = process.env.OPENROUTER_API_KEY || "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-2.0-flash-001"; // Update to latest stable
const FALLBACK_MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free"; // Update to latest free

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
      temperature: 0.7,
      stream: true // Enable streaming
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API Error: ${response.status}`;
    
    // Check for specific auth errors
    if (response.status === 401 || errorMessage.includes('User not found') || errorMessage.includes('Key not found')) {
       throw new Error(`Invalid API Key: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }

  return response;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    let response;
    try {
      // Attempt 1: Primary Model
      console.log(`Trying Primary Model: ${PRIMARY_MODEL}`);
      response = await callOpenRouter(PRIMARY_MODEL, messages, API_KEY);
    } catch (primaryError) {
      console.warn(`Primary Model failed: ${primaryError.message}. Switching to Fallback...`);
      // Attempt 2: Fallback Model
      try {
        console.log(`Trying Fallback Model: ${FALLBACK_MODEL}`);
        response = await callOpenRouter(FALLBACK_MODEL, messages, API_KEY);
      } catch (fallbackError) {
        console.error("Fallback Model also failed:", fallbackError);
        return NextResponse.json({ error: 'AI Service Temporarily Unavailable' }, { status: 500 });
      }
    }

    // Return the raw stream to the frontend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Final API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
