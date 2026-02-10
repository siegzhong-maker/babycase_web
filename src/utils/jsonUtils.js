
export function safeParseJSON(str) {
  try { return JSON.parse(str); } catch (e) {}
  
  // Markdown cleanup
  let cleanStr = str.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(cleanStr); } catch (e) {}

  // Substring extraction
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const sub = str.substring(start, end + 1);
    try { return JSON.parse(sub); } catch(e){}
  }
  
  // Regex fallback for reply (|$ handles truncated JSON without closing ", or })
  const replyMatch = str.match(/"reply"\s*:\s*"(.*?)(?=",|}|$)/s);
  if (replyMatch) return { reply: replyMatch[1], action: 'none' };

  // Manual extraction for truncated JSON: {"reply":"xxx (no closing)
  const replyKeyMatch = str.match(/"reply"\s*:\s*"/);
  if (replyKeyMatch) {
    const valueStart = replyKeyMatch.index + replyKeyMatch[0].length;
    const extracted = str.slice(valueStart).replace(/\\"/g, '"').replace(/\\n/g, '\n');
    if (extracted.length > 0) {
      return { reply: extracted, action: 'none' };
    }
  }

  return { reply: str, action: 'none' }; // Treat as raw text
}
