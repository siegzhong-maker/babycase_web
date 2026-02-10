"use client";

// 全局常量与文案配置

export const VISIT_KEY = "douzhidao_has_visited";

// 首屏情境引导入口
export const GUIDED_PROMPTS = [
  { title: "宝宝刚出生，先了解这些", query: "新生儿护理要注意什么", caseId: null },
  { title: "最近宝宝有点闹", query: "一直哭", caseId: "case_colic" },
  { title: "马上要打疫苗，提前做功课", query: "疫苗怎么打", caseId: "case_chickenpox" }
];

export const GENERIC_FALLBACK_SUGGESTIONS = ["疫苗怎么打？", "什么时候需要就医？"];

export const AI_QUESTION_PATTERNS = ["宝宝多大", "有哪些症状", "谁感冒", "什么时候开始", "是孕妈", "还是宝宝", "月龄"];

export const STAGE_RANGE_PATTERNS = [
  { pattern: /0-3月|0～3月/, value: "0-3月" },
  { pattern: /3-6月|3～6月/, value: "3-6月" },
  { pattern: /6-12月|6～12月/, value: "6-12月" },
  { pattern: /1岁以上|12月以上/, value: "1岁以上" },
];

export const OBJECT_PATTERNS = [
  { pattern: /宝宝|👶/, value: "宝宝" },
  { pattern: /孕妈|🤰|孕期/, value: "孕妈" },
  { pattern: /宝妈|👩|产后|哺乳/, value: "宝妈" },
];
