import { NextResponse } from 'next/server';

export const runtime = 'edge';

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-3-flash-preview"; 
const FALLBACK_MODEL = "google/gemini-2.0-flash-001";

// Get keys from env and split by comma, filter empty
function getApiKeys() {
  const envKeys = (process.env.OPENROUTER_API_KEY || "").split(',').map(k => k.trim()).filter(k => k);
  if (envKeys.length === 0) {
    // Fallback only if absolutely no keys found in env
    return [];
  }
  return envKeys;
}

async function callOpenRouter(model, messages, apiKey) {
  const response = await fetch(API_URL, {
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
      max_tokens: 4096,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API Error: ${response.status}`;
    
    // 401: Invalid Key, 402: Insufficient Credits, 429: Rate Limit
    if (response.status === 401 || response.status === 402 || response.status === 429 || 
        errorMessage.includes('User not found') || errorMessage.includes('Key not found')) {
       throw new Error(`Auth/RateLimit Error: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }

  return response;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;
    const apiKeys = getApiKeys();

    if (apiKeys.length === 0) {
      return NextResponse.json({ error: "No API Keys configured" }, { status: 500 });
    }

    let lastError = null;

    // --- Key Rotation Logic ---
    // Iterate through all available keys
    for (const apiKey of apiKeys) {
      try {
        let response;
        
        // Try Primary Model
        try {
          console.log(`[Key: ...${apiKey.slice(-4)}] Trying Primary Model: ${PRIMARY_MODEL}`);
          response = await callOpenRouter(PRIMARY_MODEL, messages, apiKey);
        } catch (primaryError) {
          console.warn(`[Key: ...${apiKey.slice(-4)}] Primary failed: ${primaryError.message}`);
          
          // If it's NOT an auth/rate-limit error, it might be a model issue, try fallback model with SAME key
          if (!primaryError.message.includes("Auth/RateLimit")) {
             console.log(`[Key: ...${apiKey.slice(-4)}] Trying Fallback Model: ${FALLBACK_MODEL}`);
             response = await callOpenRouter(FALLBACK_MODEL, messages, apiKey);
          } else {
             // If it IS an auth error, re-throw to trigger key rotation
             throw primaryError; 
          }
        }

        // If successful, process and return immediately
        const data = await response.json();
        const aiContent = data.choices?.[0]?.message?.content || "";
        return NextResponse.json({ content: aiContent });

      } catch (keyError) {
        console.error(`[Key: ...${apiKey.slice(-4)}] Failed: ${keyError.message}`);
        lastError = keyError;
        
        // If it's an Auth/RateLimit error, continue to next key (Loop continues)
        // If it's a server error (500), we also try next key just in case, or we could stop.
        // For robustness, we try all keys.
        continue;
      }
    }

    // If all keys failed
    return NextResponse.json({ 
      error: `All API keys failed. Last error: ${lastError?.message || 'Unknown'}` 
    }, { status: 500 });

  } catch (error) {
    console.error("Final API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
