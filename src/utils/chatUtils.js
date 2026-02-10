
import { STAGE_RANGE_PATTERNS, OBJECT_PATTERNS, AI_QUESTION_PATTERNS } from '@/config/constants';

export function getProfileUpdateFromClarifyText(text) {
  if (!text || typeof text !== "string") return {};
  const t = text.trim();
  const next = {};
  for (const { pattern, value } of STAGE_RANGE_PATTERNS) {
    if (pattern.test(t)) { next.stage_range = value; break; }
  }
  for (const { pattern, value } of OBJECT_PATTERNS) {
    if (pattern.test(t)) { next.object = value; break; }
  }
  return next;
}

export function filterSuggestions(candidates, recentUserTexts) {
  const normalize = (s) => (s || '').replace(/[？?]\s*/g, '').trim().toLowerCase();
  return candidates.filter((s) => {
    const n = normalize(s);
    if (AI_QUESTION_PATTERNS.some((p) => n.startsWith(p) || n.includes(p))) return false;
    if (recentUserTexts.some((u) => {
      const nu = normalize(u);
      return nu && (n === nu || n.includes(nu) || nu.includes(n));
    })) return false;
    return true;
  });
}
