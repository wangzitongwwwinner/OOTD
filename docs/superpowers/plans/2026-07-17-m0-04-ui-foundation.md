# M0-04 UI 基础层实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已确认原型的设计令牌、字体回退和六个基础组件迁移到 Taro 微信小程序生产工程。

**Architecture:** 全局视觉值集中在 `src/styles/tokens.scss`，组件通过统一 CSS 变量消费令牌。基础组件保持无业务状态，只暴露小程序可用的属性与事件，并用 React Testing Library 验证可访问语义和交互状态。

**Tech Stack:** Taro 4.2.0、React 18、TypeScript 5.8、SCSS、Vitest 4、React Testing Library。

## Global Constraints

- 视觉严格沿用 `DESIGN.md` 的 Urban Wardrobe Narrative，不引入远程字体或浏览器专属 DOM API。
- 页面边距 24px、8px 间距节奏、约 40×40px 最小触控目标。
- 基础组件覆盖默认、按下、禁用、加载、错误及必要成功状态。
- 整个 MVP 仅使用 `ootd-ai-dev`；本任务不操作微信开发者工具或 CloudBase。
- 未经用户再次确认不执行 Git commit 或 push。

---

### Task 1: 设计令牌与字体回退

**Files:**
- Create: `miniprogram/src/styles/tokens.scss`
- Modify: `miniprogram/src/app.scss`
- Test: `miniprogram/src/styles/tokens.test.ts`

**Interfaces:**
- Produces: `--color-*`、`--font-*`、`--space-*`、`--radius-*`、`--shadow-overlay` CSS 变量。

- [x] 写失败测试，读取令牌文件并断言品牌色、24px 页面边距、8px 节奏和本地字体回退。
- [x] 运行 `npm --prefix miniprogram test -- tokens.test.ts`，确认因令牌文件缺失失败。
- [x] 实现令牌并由 `app.scss` 引入。
- [x] 重跑测试、类型检查和 lint，确认通过。

### Task 2: Button 与 Card

**Files:**
- Create: `miniprogram/src/components/Button/Button.tsx`
- Create: `miniprogram/src/components/Button/Button.scss`
- Create: `miniprogram/src/components/Card/Card.tsx`
- Create: `miniprogram/src/components/Card/Card.scss`
- Create: `miniprogram/src/components/index.ts`
- Test: `miniprogram/src/components/Button/Button.test.tsx`
- Test: `miniprogram/src/components/Card/Card.test.tsx`

**Interfaces:**
- Produces: `Button({ variant, loading, disabled, onClick, children })` 与 `Card({ tone, children })`。

- [x] 写失败组件测试，覆盖主/次按钮、加载禁用和 Card 语义内容。
- [x] 运行定向测试，确认因组件不存在失败。
- [x] 实现最小组件及令牌化样式。
- [x] 重跑定向测试，确认通过。

### Task 3: FormField、EmptyState 与 ErrorState

**Files:**
- Create: `miniprogram/src/components/FormField/FormField.tsx`
- Create: `miniprogram/src/components/FormField/FormField.scss`
- Create: `miniprogram/src/components/EmptyState/EmptyState.tsx`
- Create: `miniprogram/src/components/ErrorState/ErrorState.tsx`
- Create: `miniprogram/src/components/StatePanel/StatePanel.scss`
- Test: `miniprogram/src/components/FormField/FormField.test.tsx`
- Test: `miniprogram/src/components/StatePanel/StatePanel.test.tsx`

**Interfaces:**
- Produces: 带标签、说明和错误关联的 `FormField`；可选操作的 `EmptyState`、`ErrorState`。

- [x] 写失败测试，覆盖字段标签/错误关联、空态操作和错误重试。
- [x] 运行定向测试，确认因组件不存在失败。
- [x] 实现最小组件和共享状态面板样式。
- [x] 重跑定向测试，确认通过。

### Task 4: BottomSheet 与基础层汇总验收

**Files:**
- Create: `miniprogram/src/components/BottomSheet/BottomSheet.tsx`
- Create: `miniprogram/src/components/BottomSheet/BottomSheet.scss`
- Test: `miniprogram/src/components/BottomSheet/BottomSheet.test.tsx`
- Modify: `miniprogram/src/pages/index/index.tsx`
- Modify: `miniprogram/src/pages/index/index.scss`
- Modify: `TASK.md`
- Modify: `PROGRESS.md`

**Interfaces:**
- Produces: `BottomSheet({ open, title, onClose, children })`，支持遮罩关闭、可访问标题和底部安全区。

- [x] 写失败测试，覆盖关闭态不渲染、打开态标题/内容和遮罩关闭。
- [x] 运行定向测试，确认因组件不存在失败。
- [x] 实现 BottomSheet，并将工程占位页改为基础组件展示页以供开发者工具视觉检查。
- [x] 运行全部小程序测试、类型检查、lint、格式检查、构建和 `git diff --check`。
- [x] 更新 `TASK.md` 与 `PROGRESS.md`，记录自动化结果和待用户完成的开发者工具视觉验收。
