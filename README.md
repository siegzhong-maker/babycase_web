# 兜知道 Web App

这是一个基于 Next.js + Tailwind CSS 构建的现代 Web 应用，复刻了原小程序的体验，并专为 Vercel 部署优化。

## 功能特性
- **AI 智能对话**: 集成 OpenRouter API，提供专业月嫂建议。
- **SOP 向导**: 可视化分步操作指引。
- **烦恼墙**: 快速标签提问。
- **安全代理**: 后端 API Route 保护 API Key 不泄露。

## 本地运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 访问 `http://localhost:3000` (或 3001)。

## 部署到 Vercel

1. 将本项目推送到 GitHub。
2. 在 Vercel 后台 Import Project。
3. Vercel 会自动识别 Next.js 项目，无需额外配置，点击 **Deploy** 即可。

## 目录结构
- `src/app/page.js`: 主页面逻辑。
- `src/app/api/chat/route.js`: 后端 API 代理。
- `src/components/`: UI 组件。
- `src/data/`: 本地知识库。
