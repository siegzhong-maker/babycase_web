"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import SopWizard from '@/components/SopWizard';
import WorryWall from '@/components/WorryWall';
import ClarifyCard from '@/components/ClarifyCard';
import { KNOWLEDGE_BASE } from '@/data/knowledge_base';

// Helper for JSON parsing
function safeParseJSON(str) {
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
  
  // Regex fallback for reply
  const replyMatch = str.match(/"reply"\s*:\s*"(.*?)(?=",|})/s);
  if (replyMatch) return { reply: replyMatch[1], action: 'none' };
  
  return { reply: str, action: 'none' }; // Treat as raw text
}

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      reply: "宝妈你好呀！我是兜兜阿姨\n今天宝宝状态怎么样？不管是吃喝拉撒，还是生病护理，我都在哦。",
      action: 'none'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [worryTags, setWorryTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Load Tags
  useEffect(() => {
    // 覆盖默认Tags，展示测试场景
    const testScenarios = [
      { id: "case_vomit_ambiguous", display_tag: "🤢 吃完就吐", query: "吃完就吐" },
      { id: "case_wake_ambiguous", display_tag: "😴 半夜老是醒", query: "半夜老是醒" },
      { id: "case_fetal_movement", display_tag: "👣 感觉宝宝不动了", query: "感觉宝宝不动了" },
      { id: "case_colic", display_tag: "😭 一直哭", query: "一直哭" },
      { id: "case_cold_ambiguous", display_tag: "🤧 发烧了怎么办", query: "发烧了怎么办" }
    ];
    setWorryTags(testScenarios);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (overrideText = null, forceCaseId = null) => {
    const text = overrideText || input.trim();
    if (!text || isLoading) return;

    // Add User Message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
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

      // 2. Build Prompt
      let systemPrompt = `# Role
你是一位拥有20年临床护理经验的“金牌母婴护理专家”，专注于孕期（-1岁）到幼儿3岁的母婴护理。
你的特点是专业、温暖、耐心且极其严谨。你不是医生，不进行医疗诊断，但在护理建议上比通用AI更细致、更具实操性。

# Goal
你的目标是缓解用户的育儿焦虑，通过专业的询问引导出用户的真实情况，提供针对性的护理建议，并鼓励用户持续互动。

# Workflow (关键交互逻辑)
每一次回复必须严格遵守以下思考步骤（Chain of Thought）：

## Step 1: 关键信息完整性自检 (The Pre-Ask Logic)
在回答任何问题前，检查用户是否提供了以下**必须信息**：
1. **对象是谁？** (孕妈本人？还是宝宝？)
2. **具体阶段？** (孕周？宝宝月龄/年龄？)
3. **核心症状/细节？** (体温多少？持续多久？具体表现？)

**规则：**
- 如果缺失任意一项关键信息，**立刻停止给出建议**，返回 "action": "clarify" 并生成选项，或者直接反向追问。
- 追问要像聊天一样自然，不要像填表格。

## Step 2: 专业护理建议 (仅在信息完整时进行)
- **区分医疗与护理：** 明确告知哪些情况需要立刻去医院，哪些可以在家观察。
- **实操性强：** 不要只说“注意保暖”，要说“室温控制在24-26度，穿一件连体衣加睡袋”。
- **结构化输出：** 使用 Emoji 和分点，降低阅读负担。

## Step 3: 预测性关怀与引导 (The Post-Ask Logic)
- 在回答结尾，必须根据当前话题，预测用户可能忽略的下一个风险点或知识点。
- 将这些点转化为**用户视角的追问** (放入 suggestions 字段)。
- **注意：** "suggestions" 必须是用户想问的问题，而不是你对用户的提问！
  - ❌ 错误： "家里有体温计吗？" (这是AI问用户)
  - ✅ 正确： "体温计怎么选？" (这是用户问AI)
  - ✅ 正确： "发烧会烧坏脑子吗？"
  - ✅ 正确： "什么时候要去医院？"

# Constraints
- 语气：像一位值得信赖的大姐姐，温暖（使用“亲爱的”、“宝妈”、“咱们宝宝”），但不轻浮。
- 安全红线：涉及高烧不退、剧烈腹痛、外伤等紧急情况，第一建议永远是“就医”，随后才是护理建议。

数据格式：纯JSON。
{
  "reply": "话术...",
  "action": "none" 或 "sop" 或 "clarify", 
  "clarifyOptions": [
    { "text": "选项文案", "next_id": "关联ID(可选)" }
  ],
  "sopData": { 
    "title": "SOP标题",
    "preps": ["准备项1", "准备项2"],
    "steps": [
      { "title": "步骤标题(必填)", "desc": "步骤详情(必填)" }
    ]
  },
  "suggestions": ["怎么区分溢奶和吐奶？", "需要吃益生菌吗？"]
}`;

      if (matchedCase) {
        // Check for ambiguity configuration in Knowledge Base
        if (matchedCase.is_ambiguous && matchedCase.clarify_options) {
           systemPrompt += `\n\n【系统检测到歧义场景】
当前匹配到：${matchedCase.display_tag}
该场景存在歧义，请务必返回 "action": "clarify"，并使用以下选项：
${JSON.stringify(matchedCase.clarify_options)}
(请礼貌询问用户具体情况)`;
        } else {
           systemPrompt += `\n\n【月嫂经验知识库 - 请参考此方案进行解答】
CASE_TAG: ${matchedCase.tags.join(', ')}
SOLUTION: ${matchedCase.solution}
WARNING: ${matchedCase.warning}
(请将此解决方案内化为你的专业建议，语气要亲切笃定)`;
        }
      } else {
        systemPrompt += `\n\n(未匹配到特定知识库，请基于你的专业月嫂知识进行解答。如果问题模糊，请发起追问)`;
      }

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system').slice(-4).map(m => ({
          role: m.role,
          content: m.role === 'user' ? m.content : (m.reply || '')
        })),
        { role: 'user', content: text }
      ];

      // 3. Call API (Standard JSON, no streaming for stability)
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
        reply: aiData.reply || fullContent || "阿姨有点忙，没听清，能再说一遍吗？", // Fallback to raw text if JSON parse fails
        action: aiData.action,
        sopData: aiData.sopData,
        clarifyOptions: aiData.clarifyOptions
      };

      // Replace the "Thinking..." message with the final message
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = aiMsg;
        return newMsgs;
      });

      if (aiData.suggestions) setSuggestions(aiData.suggestions);

    } catch (error) {
      console.error(error);
      
      let errorReply = "网络开小差了，兜兜没听清 😣\n请检查网络后重试。";
      
      // 如果是 API Key 无效的错误，给出明确提示
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

  const handleTagClick = (tag) => {
    // Send the display text as the message, but use the ID for context retrieval
    sendMessage(tag.display_tag, tag.id);
  };

  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  const handleClarifyOptionClick = (option) => {
    // User clicked a clarify option (e.g. "宝宝感冒")
    // Send it as user message, and optionally pass next_id if available to force context
    sendMessage(option.text, option.next_id);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col items-center">
      {/* Mobile Frame */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-4 py-3 text-center">
          <h1 className="font-bold text-lg text-gray-800">兜知道</h1>
        </header>

        {/* Disclaimer */}
        <div className="bg-orange-100 text-orange-700 text-xs px-4 py-2 text-center font-medium">
          AI建议仅供参考，如遇高烧/惊厥等急症请立即就医
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {/* Welcome Worry Wall (Only show if history is short) */}
          {messages.length <= 1 && (
            <WorryWall tags={worryTags} onTagClick={handleTagClick} />
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-white border-2 border-emerald-100 text-emerald-500'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={24} />}
              </div>

              {/* Bubble */}
              <div className="max-w-[80%] space-y-2">
                {msg.role === 'assistant' && <div className="text-xs text-gray-400 ml-1">兜兜 (金牌月嫂)</div>}
                
                {(msg.content || msg.reply) && (
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-emerald-500 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
                    {msg.content || msg.reply}
                  </div>
                )}

                {/* SOP Wizard Component */}
                {msg.role === 'assistant' && msg.action === 'sop' && msg.sopData && (
                  <SopWizard data={msg.sopData} />
                )}

                {/* Clarification Card Component */}
                {msg.role === 'assistant' && msg.action === 'clarify' && msg.clarifyOptions && (
                  <ClarifyCard options={msg.clarifyOptions} onOptionClick={handleClarifyOptionClick} />
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-100 flex items-center justify-center shadow-sm">
                <Bot size={24} className="text-emerald-500" />
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Suggestions */}
        {!isLoading && suggestions.length > 0 && (
          <div className="px-4 pb-2">
             <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mb-2 px-1">
               <Sparkles size={12} />
               <span>猜你想问</span>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {suggestions.map((sugg, i) => (
                 <button 
                   key={i} 
                   onClick={() => handleSuggestionClick(sugg)}
                   className="whitespace-nowrap px-4 py-2 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100 active:scale-95 transition-transform"
                 >
                   {sugg}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 pb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="问问兜兜..."
              disabled={isLoading}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button 
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-90 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
