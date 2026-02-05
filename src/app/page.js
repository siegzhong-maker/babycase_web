"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Bot, Sparkles, BookOpen } from 'lucide-react';
import SopWizard from '@/components/SopWizard';
import WorryWall from '@/components/WorryWall';
import ClarifyCard from '@/components/ClarifyCard';
import BabyProfileModal, { loadProfile, saveProfile } from '@/components/BabyProfileModal';
import { calculateAge } from '@/utils/age';
import { KNOWLEDGE_BASE } from '@/data/knowledge_base';

const GENERIC_FALLBACK_SUGGESTIONS = ["疫苗怎么打？", "什么时候需要就医？"];

const AI_QUESTION_PATTERNS = ["宝宝多大", "有哪些症状", "谁感冒", "什么时候开始", "是孕妈", "还是宝宝", "月龄"];

const VISIT_KEY = "douzhidao_has_visited";
function getHasVisited() {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(VISIT_KEY) === "1"; } catch (e) { return false; }
}
function setHasVisited() {
  try { localStorage.setItem(VISIT_KEY, "1"); } catch (e) {}
}

const WELCOME_FIRST = "宝妈你好～我是兜兜阿姨，带过好多娃，吃喝拉撒、生病护理都能问，别客气～\n\n不知道问啥？可以点下面情境试试～";
const WELCOME_RETURN = "宝妈你好～有啥想问的尽管说，或点下面常见问题～";

const GUIDED_PROMPTS = [
  { title: "宝宝刚出生，先了解这些", query: "新生儿护理要注意什么", caseId: null },
  { title: "最近宝宝有点闹", query: "一直哭", caseId: "case_colic" },
  { title: "马上要打疫苗，提前做功课", query: "疫苗怎么打", caseId: "case_chickenpox" }
];

const STAGE_RANGE_PATTERNS = [
  { pattern: /0-3月|0～3月/, value: "0-3月" },
  { pattern: /3-6月|3～6月/, value: "3-6月" },
  { pattern: /6-12月|6～12月/, value: "6-12月" },
  { pattern: /1岁以上|12月以上/, value: "1岁以上" },
];
const OBJECT_PATTERNS = [
  { pattern: /宝宝|👶/, value: "宝宝" },
  { pattern: /孕妈|🤰|孕期/, value: "孕妈" },
  { pattern: /宝妈|👩|产后|哺乳/, value: "宝妈" },
];
function getProfileUpdateFromClarifyText(text) {
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

function filterSuggestions(candidates, recentUserTexts) {
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

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      reply: WELCOME_FIRST,
      action: 'none'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [worryTags, setWorryTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [profile, setProfile] = useState({ name: '糯米', gender: '男孩', birth: '2024-11-20' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasVisited, setHasVisitedState] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setProfile(loadProfile());
    const visited = getHasVisited();
    setHasVisitedState(visited);
    if (visited) {
      setMessages(prev => prev.length === 1 && prev[0].role === 'assistant'
        ? [{ ...prev[0], reply: WELCOME_RETURN }] : prev);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) setHasVisited();
  }, [messages.length]);

  const handleSaveProfile = (next) => {
    setProfile(next);
    saveProfile(next);
  };

  // Load Tags
  useEffect(() => {
    // 覆盖默认Tags，展示测试场景
    const testScenarios = [
      { id: "case_fetal_movement", display_tag: "👣 怎么数胎动", query: "怎么数胎动" },
      { id: "case_cold_ambiguous", display_tag: "🤧 感冒了怎么办", query: "感冒了怎么办" },
      { id: "case_wake_ambiguous", display_tag: "😴 半夜老是醒", query: "半夜老是醒" },
      { id: "case_vomit_ambiguous", display_tag: "🤢 吃完就吐", query: "吃完就吐" },
      { id: "case_colic", display_tag: "😭 一直哭", query: "一直哭" }
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

# 当前宝宝档案
用户已录入：宝宝昵称 ${profile.name}，${profile.gender}，出生 ${profile.birth}（约${calculateAge(profile.birth)}）${profile.stage_range ? `，当前阶段：${profile.stage_range}` : ''}${profile.object ? `，对象：${profile.object}` : ''}。回复时请聚焦该宝宝，可自然称呼其昵称，并根据月龄/年龄给出适宜建议。

# Goal
你的目标是缓解用户的育儿焦虑，通过专业的询问引导出用户的真实情况，提供针对性的护理建议，并鼓励用户持续互动。

# Workflow (关键交互逻辑)
每一次回复必须严格遵守以下思考步骤（Chain of Thought）：

## Step 1: 关键信息完整性自检 (The Pre-Ask Logic)
在回答任何问题前，检查用户是否提供了以下**必须信息**：
1. **对象是谁？** (孕妈本人？还是宝宝？还是宝妈（产后）？)
2. **具体阶段？** (孕周？宝宝月龄/年龄？)
3. **核心症状/细节？** (体温多少？持续多久？具体表现？)

**追问顺序与逻辑（必须严格遵守）：**
- **硬性约束**：禁止任何纯文字追问要求用户手动输入。凡需追问，必须返回 "action": "clarify" 且 clarifyOptions 非空。
- **追问时的输出结构**：若需追问，reply 仅可包含安抚/过渡话术（如「别着急，咱们先确认一下情况」），**禁止**在 reply 中写出具体问题或选项。具体追问选项必须全部放入 clarifyOptions。
- **禁止在 reply 中写**：任何形式的追问句，例如「宝宝/糯米多大了呢？」「现在多大了？」「除了XX还有其他症状吗？」「什么时候开始的？」等。此类内容必须转化为 clarifyOptions 的可点选选项。
- **对象优先**：先问「是孕妈本人、宝宝还是宝妈（产后）」？clarifyOptions 使用这三个互斥选项。
- **互斥规则**：孕妈 = 孕期，不会哺乳；只有「宝妈（产后）」才可能哺乳期。选「孕妈」时绝不出现哺乳期相关追问。
- **阶段追问**：确定对象后再问孕周/月龄。孕周追问必须提供可点选区间（如 12周以内、12-24周、24-32周、32周以上），禁止用「孕早期/孕中期/孕晚期」三档或让用户手动输入周数。月龄追问必须返回 clarifyOptions，如 0-3月、3-6月、6-12月、1岁以上。
- **【对象锁定 - 不可违反】**：一旦用户已通过 clarifyOptions 或消息选择了对象（宝宝/孕妈/宝妈），该对象在本次对话中不可切换。后续所有 reply、clarifyOptions、追问必须严格围绕该对象。**严禁**：用户选了「宝妈（产后）」后仍追问宝宝月龄、宝宝症状、宝宝名字等；用户选了「宝宝」后追问孕周或孕妈用药。对象=宝妈时，只可追问宝妈自身：产后多久、情绪状态、睡眠、身体不适等。
- 如果缺失任意一项关键信息，**立刻停止给出建议**，返回 "action": "clarify" 和 clarifyOptions。
- **追问有有限选项时**（如：一直哭 vs 突然开始哭 vs 有其他症状），必须返回 "action": "clarify" 和 clarifyOptions。示例：clarifyOptions: [{ "text": "一直哭", "next_id": null }, { "text": "突然开始哭", "next_id": null }, { "text": "有其他症状（发烧/拉肚子等）", "next_id": null }]
- 追问要像聊天一样自然，不要像填表格。

**追问选项参考**（可直接套用）：
| 追问类型 | clarifyOptions 示例 |
| 对象 | 孕妈本人 / 宝宝 / 宝妈（产后） |
| 孕周 | 12周以内 / 12-24周 / 24-32周 / 32周以上 |
| 月龄 | 0-3月 / 3-6月 / 6-12月 / 1岁以上 |
| 体温 | 低于38度 / 38-38.5度 / 38.5-39度 / 39度以上 |
| 持续 | 刚发现 / 1-2天 / 3天以上 |
| 症状 | 视场景而定（如哭闹：一直哭 / 突然开始哭 / 伴有发烧等） |
根据当前缺失的信息（对象/月龄/症状/体温/持续等），从参考表中选择或组合生成 clarifyOptions。选项数量 3–6 个为宜，覆盖常见情况，最后可加「其他，我来补充」作为兜底。无法穷举时，用代表性区间或典型选项覆盖主要场景。

## Step 2: 专业护理建议 (仅在信息完整时进行)
- **区分医疗与护理：** 明确告知哪些情况需要立刻去医院，哪些可以在家观察。
- **实操性强：** 不要只说“注意保暖”，要说“室温控制在24-26度，穿一件连体衣加睡袋”。
- **操作定义必含：** 若涉及**可数操作**（如胎动、喂奶次数、疫苗接种、换尿布等），必须明确写出「怎么算一次」的说明。例如：胎动「连续动算一次，停顿几分钟后再动算另一次」；水痘疫苗「接种本每记录一剂算一针」。疫苗/接种类务必含「怎么算一针」，这是用户实操时最难以估计的内容。
- **结构化输出：** 使用 Emoji 和分点，降低阅读负担。

## Wizard 模式 (SOP) - 卡片式分步展示
当回答包含**多条结构化建议**时，必须返回 "action": "sop"，以卡片形式分步展示，便于用户逐步查看。适用场景包括：
1. **具体操作流程**：排气操、拍嗝、洗澡、换尿布、抚触等
2. **居家护理建议**：感冒护理、发烧护理、吐奶护理等（多条建议拆成 steps，不要堆在 reply 里）
sopData 结构：
- title：操作/护理名称（如「宝宝感冒居家护理」）
- preps：准备/就医指征（如「发烧超过38.5°C需就医」；可为空数组）
- steps：步骤数组，每项含 title 和 desc，描述简练、适合手机卡片阅读。reply 中简要概括，详细内容放在 steps 里

## Step 3: 预测性关怀与引导 (The Post-Ask Logic)
- **每一轮回复都必须包含 suggestions**，至少 2 个，便于用户点选追问。
- **suggestions 必须是用户想问的问题**，而不是你对用户的提问。suggestions 应围绕当前话题的延伸，而不是重复或追问已提供的信息。
- **禁止**将 AI 追问用户的问题放入 suggestions，例如「宝宝多大？」「有哪些症状？」「谁感冒了？」「什么时候开始的？」等。
- **正确**：放入用户可能接着问的问题，如「疫苗怎么打？」「什么时候需要就医？」「需要吃益生菌吗？」「怎么区分溢奶和吐奶？」。
  - ❌ 错误： "家里有体温计吗？" (这是AI问用户)
  - ❌ 错误： "宝宝多大？" "有哪些症状？" (AI追问用户)
  - ✅ 正确： "体温计怎么选？" (用户问AI)
  - ✅ 正确： "发烧会烧坏脑子吗？" "什么时候要去医院？"
  - ✅ 正确： "怎么算一次胎动？" "疫苗怎么算一针？"

# Constraints
- 语气：像一位值得信赖的大姐姐，温暖（使用“亲爱的”、“宝妈”、“咱们宝宝”），但不轻浮。
- 安全红线：涉及高烧不退、剧烈腹痛、外伤等紧急情况，第一建议永远是“就医”，随后才是护理建议。

数据格式：纯JSON。当需要追问时，action 必须为 "clarify"，clarifyOptions 为必填。
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

      // 3a. 注入已确认对象（用户本轮或历史中选择的 宝宝/孕妈/宝妈）
      const objectFromText = getProfileUpdateFromClarifyText(text).object;
      const confirmedObject = objectFromText || profile.object;
      if (confirmedObject) {
        const objectGuidance = confirmedObject === '宝妈'
          ? `【已确认对象】用户已选择「宝妈（产后）」。\n- 禁止追问：宝宝月龄、宝宝症状、宝宝名字、宝宝体温等一切与宝宝相关的内容。\n- 只可追问宝妈自身：产后多久（如 月子内/1-3月/3-6月）、情绪状态（情绪低落/焦虑/易怒）、睡眠（失眠/睡不好）、身体不适（伤口/恶露/头疼等）。\n- clarifyOptions 必须全部与宝妈相关，示例：月子内 / 出月子1-3月 / 情绪有点低落 / 睡眠不好 / 其他。`
          : confirmedObject === '孕妈'
          ? `【已确认对象】用户已选择「孕妈（孕期）」。\n- 禁止追问：宝宝月龄、哺乳期相关。\n- 只可追问孕妈自身：孕周、症状、身体不适等。`
          : `【已确认对象】用户已选择「宝宝」。\n- 可追问宝宝月龄、症状等。\n- 禁止追问孕周或孕妈用药。`;
        systemPrompt += `\n\n${objectGuidance}`;
      }

      // 对象锁定：若用户已选宝妈/孕妈，不得使用宝宝专属 case 的内容
      const BABY_ONLY_IDS = ["case_colic", "case_spit_milk", "case_cold_baby", "case_sleep_reversal"];
      if (confirmedObject === '宝妈' || confirmedObject === '孕妈') {
        if (matchedCase && BABY_ONLY_IDS.includes(matchedCase.id)) matchedCase = null;
      }

      if (matchedCase) {
        const scenarioBlock = (matchedCase.core_question || matchedCase.related_scenarios || matchedCase.decision_criteria)
          ? `\n【场景结构】核心问题：${matchedCase.core_question || '无'}；相关场景：${(matchedCase.related_scenarios || []).join('、')}；判定条件：${matchedCase.decision_criteria || '无'}`
          : '';
        if (matchedCase.is_ambiguous && matchedCase.clarify_options) {
           systemPrompt += `\n\n【系统检测到歧义场景】
当前匹配到：${matchedCase.display_tag}
该场景存在歧义，请务必返回 "action": "clarify"，并使用以下选项：
${JSON.stringify(matchedCase.clarify_options)}
(请礼貌询问用户具体情况)${scenarioBlock}`;
        } else {
           systemPrompt += `\n\n【月嫂经验知识库 - 请参考此方案进行解答】
CASE_TAG: ${matchedCase.tags.join(', ')}
SOLUTION: ${matchedCase.solution}
WARNING: ${matchedCase.warning}
(请将此解决方案内化为你的专业建议，语气要亲切笃定)${scenarioBlock}`;
        }
      } else {
        systemPrompt += `\n\n(未匹配到特定知识库，请基于你的专业月嫂知识进行解答。如果问题模糊，必须返回 action: "clarify" 和 clarifyOptions，禁止纯文字追问)`;
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
        reply: aiData.reply || fullContent || "阿姨有点忙，没听清，能再说一遍吗？", 
        action: aiData.action,
        sopData: aiData.sopData,
        clarifyOptions: aiData.clarifyOptions
      };

      setMessages(prev => [...prev, aiMsg]);

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
    const update = getProfileUpdateFromClarifyText(option.text);
    if (Object.keys(update).length > 0) {
      const next = { ...profile, ...update };
      setProfile(next);
      saveProfile(next);
    }
    sendMessage(option.text, option.next_id);
  };

  const handleGuidedClick = (item) => {
    sendMessage(item.query, item.caseId || null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col items-center">
      {/* Mobile Frame */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg text-gray-800">兜知道</h1>
          <button
            onClick={() => setShowProfileModal(true)}
            className="p-2 -m-2 text-gray-500 hover:text-emerald-600 rounded-full transition-colors"
            title="兜兜小本"
          >
            <BookOpen size={22} />
          </button>
        </header>

        {/* Disclaimer */}
        <div className="bg-orange-100 text-orange-700 text-xs px-4 py-2 text-center font-medium">
          AI建议仅供参考，如遇高烧/惊厥等急症请立即就医
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {/* Welcome: 情境引导(仅首次) + 月嫂阿姨常被问 */}
          {!messages.some(m => m.role === 'user') && (
            <WorryWall
              tags={worryTags}
              onTagClick={handleTagClick}
              guidedPrompts={!hasVisited ? GUIDED_PROMPTS : null}
              onGuidedClick={handleGuidedClick}
            />
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
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-emerald-500 text-white rounded-tr-sm whitespace-pre-wrap' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm prose prose-sm prose-p:my-1 prose-ul:my-2 prose-li:my-0 max-w-none'}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.reply || ''}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
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

        {/* Suggestions - 提问后推荐 */}
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

        {/* 提问前推荐：月嫂阿姨常被问（与猜你想问互斥，suggestions 为空时展示） */}
        {messages.length > 1 && suggestions.length === 0 && !isLoading && (
          <WorryWall tags={worryTags} onTagClick={handleTagClick} compact />
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

        <BabyProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={profile}
          onSave={handleSaveProfile}
        />
      </div>
    </div>
  );
}
