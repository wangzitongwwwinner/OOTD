# 今天穿什么

“今天穿什么”MVP 的交互原型与后续前后端开发基线。当前版本使用 React、TypeScript、Vite 与 Express，产品事实见 `PRODUCT.md`，视觉规范见 `DESIGN.md`，实施状态见 `PROGRESS.md`。

## 本地运行

```powershell
npm install
npm run dev
```

访问 <http://127.0.0.1:3000>。

`GEMINI_API_KEY` 为可选配置；未配置时，穿衣建议接口使用本地温度规则降级。

## 验证

```powershell
npm run lint
npm run build
```

HTML/React 原型用于确认产品与交互，不代表最终微信小程序生产架构。
