
import { useState } from 'react';
import { trackEvent } from '@/utils/analytics';
import { KNOWLEDGE_BASE } from '@/data/knowledge_base';
import { generateSystemPrompt } from '@/utils/promptGenerator';
import { safeParseJSON } from '@/utils/jsonUtils';
import { getProfileUpdateFromClarifyText, filterSuggestions } from '@/utils/chatUtils';
import { GENERIC_FALLBACK_SUGGESTIONS } from '@/config/constants';
import { saveProfile } from '@/components/BabyProfileModal';

const WELCOME_FIRST =
  "宝妈你好～我是兜兜阿姨，带过好多娃，吃喝拉撒、生病护理都能问，别客气～\n\n不知道怎么开口，可以先按上面的情境试试，或者点下面常见问题一键提问～";

export function useChat(profile, onUpdateProfile) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      reply: WELCOME_FIRST,
      action: 'none'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const sendMessage = async (text, forceCaseId = null) => {
    if (!text || isLoading) return;

    // Add User Message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 1. Context Retrieval
      let matchedCase = null;
      if (forceCaseId) {
        matchedCase = KNOWLEDGE_BASE.find(c => c.id === forceCaseId);
      } else {
        matchedCase = KNOWLEDGE_BASE.find(kCase => 
          kCase.tags.some(tag => text.includes(tag))
        );
      }

      // 2. Determine Object & Stage (Auto-update profile)
      const updates = getProfileUpdateFromClarifyText(text);
      const objectFromText = updates.object;
      const stageFromText = updates.stage_range;
      
      let nextProfile = { ...profile };
      let hasUpdate = false;
      
      if (objectFromText && objectFromText !== profile.object) {
        nextProfile.object = objectFromText;
        hasUpdate = true;
      }
      if (stageFromText && stageFromText !== profile.stage_range) {
        nextProfile.stage_range = stageFromText;
        hasUpdate = true;
      }
      
      if (hasUpdate && onUpdateProfile) {
        onUpdateProfile(nextProfile);
        saveProfile(nextProfile); // Ensure persistence
      }

      const confirmedObject = objectFromText || profile.object;
      
      // Object Locking for Baby Only cases
      const BABY_ONLY_IDS = ["case_colic", "case_spit_milk", "case_cold_baby", "case_sleep_reversal"];
      if (confirmedObject === '宝妈' || confirmedObject === '孕妈') {
        if (matchedCase && BABY_ONLY_IDS.includes(matchedCase.id)) matchedCase = null;
      }

      // 3. Build Prompt
      const systemPrompt = generateSystemPrompt({
        profile: nextProfile,
        matchedCase,
        confirmedObject
      });

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system').slice(-4).map(m => ({
          role: m.role,
          content: m.role === 'user' ? m.content : (m.reply || '')
        })),
        { role: 'user', content: text }
      ];

      // 4. Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }

      const resData = await response.json();
      const fullContent = resData.content || "";

      // 5. Parse Final JSON
      const aiData = safeParseJSON(fullContent);
      
      const aiMsg = {
        role: 'assistant',
        reply: aiData.reply || fullContent || "阿姨有点忙，没听清，能再说一遍吗？", 
        action: aiData.action,
        sopData: aiData.sopData,
        clarifyOptions: aiData.clarifyOptions
      };

      setMessages(prev => [...prev, aiMsg]);

      // 6. Handle Suggestions
      let raw = [];
      if (aiData.suggestions && Array.isArray(aiData.suggestions) && aiData.suggestions.length > 0) {
        raw = aiData.suggestions;
      } else if (matchedCase?.fallback_suggestions?.length > 0) {
        raw = matchedCase.fallback_suggestions;
      } else if (!matchedCase) {
        raw = GENERIC_FALLBACK_SUGGESTIONS;
      }
      const recentUserTexts = [text, ...messages.filter((m) => m.role === 'user').map((m) => m.content).slice(-3)];
      const filtered = filterSuggestions(raw, recentUserTexts);
      setSuggestions(filtered.slice(0, 2));

    } catch (error) {
      console.error(error);
      
      let errorReply = "网络开小差了，兜兜没听清 😣\n请检查网络后重试。";
      
      if (error.message.includes("Invalid API Key") || error.message.includes("User not found")) {
          errorReply = "⚠️ 系统提示：API Key 无效或已过期。\n\n请在后台配置正确的 OPENROUTER_API_KEY 环境变量。";
      } else if (error.message.includes("AI Service Temporarily Unavailable")) {
          errorReply = "⚠️ AI 服务暂时不可用，请稍后重试。\n(可能是模型服务不稳定)";
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        reply: errorReply,
        action: 'none'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    suggestions,
    sendMessage
  };
}
