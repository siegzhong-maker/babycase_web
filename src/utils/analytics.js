"use client";

// 简单埋点工具：当前仅打印到控制台，后续可接入真实分析平台

export function trackEvent(eventName, payload = {}) {
  try {
    // 这里预留真实埋点接入点，例如 window.gtag / sensors / bury 等
    // 暂时先打印，便于在浏览器中观察行为
    // eslint-disable-next-line no-console
    console.log("[analytics]", eventName, payload);
  } catch {
    // 避免埋点异常影响主流程
  }
}

