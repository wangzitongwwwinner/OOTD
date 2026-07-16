# M0-00 Taro 微信构建验证 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成可由微信开发者工具导入、编译、预览和真机打开的最小 Taro 微信小程序构建。

**Architecture:** 在现有 React/Vite 原型旁新增独立的 `miniprogram/` 生产目录，不移动或改写原型。根目录 npm 脚本负责调用 Taro CLI，微信输出固定为 `miniprogram/dist`，共享 `project.config.json` 使用已确认 AppID。

**Tech Stack:** Taro 3.x、React 18、TypeScript 5.x、Node.js 内置测试运行器、微信开发者工具。

## Global Constraints

- 微信目标 AppID 为 `wxf9475a79c2296561`，不得写入 AppSecret。
- 整个 MVP 仅使用上海地域的 CloudBase 环境 `ootd-ai-dev`。
- `project.private.config.json` 仅限本机且不得提交。
- 未经用户确认不得预览、上传、部署、提交或推送。
- 当前 React/Vite 原型继续保留为 UI 与交互基线。

---

### Task 1: 最小 Taro 微信工程

**Files:**
- Create: `tests/m0-00-taro-bootstrap.test.mjs`
- Create: `miniprogram/config/index.ts`
- Create: `miniprogram/src/app.config.ts`
- Create: `miniprogram/src/app.tsx`
- Create: `miniprogram/src/app.scss`
- Create: `miniprogram/src/pages/index/index.config.ts`
- Create: `miniprogram/src/pages/index/index.tsx`
- Create: `miniprogram/src/pages/index/index.scss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/src/sitemap.json`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: 根目录 npm 工作区和微信 AppID `wxf9475a79c2296561`。
- Produces: 从根目录进入 `miniprogram/` 执行的 `npm run build:weapp` 命令，以及可导入的 `miniprogram/dist`。

- [x] **Step 1: Write the failing test**

  创建 Node 测试，断言 `build:weapp` 脚本、Taro `outputRoot`、AppID、首页路由和私有配置忽略规则存在。

- [x] **Step 2: Run test to verify it fails**

  Run: `node --test tests/m0-00-taro-bootstrap.test.mjs`

  Expected: FAIL，原因是 `build:weapp` 或 `miniprogram` 配置尚不存在。

- [x] **Step 3: Write minimal implementation**

  添加 Taro 构建依赖、最小首页、项目配置和忽略规则，不迁移业务 UI。

- [x] **Step 4: Run test and build to verify they pass**

  Run: `node --test tests/m0-00-taro-bootstrap.test.mjs`

  Expected: PASS。

  Run: `npm run build:weapp`

  Expected: exit 0，生成 `miniprogram/dist/app.json` 和首页产物。

- [x] **Step 5: Run repository gates**

  Run: `npm run lint`

  Run: `npm run build`

  Run: `git diff --check`

  Expected: 全部 exit 0。

- [x] **Step 6: Record status without committing**

  更新 `TASK.md` 和 `PROGRESS.md` 为“待项目所有者在开发者工具验收”，不执行 commit 或 push。
