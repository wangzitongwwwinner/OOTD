# M0-05 自动化质量基线实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可复现的脱敏测试夹具、单 CloudBase 环境配置和不接触真实云资源的 GitHub Actions 质量门禁。

**Architecture:** `config/environments.json` 作为三个构建阶段到唯一环境的静态映射，`tests/fixtures` 保存固定时区、天气和外部服务结果，所有可清理测试数据统一使用 `__test__` 标记。根目录 `quality` 脚本编排各包测试、类型检查、格式和构建，GitHub Actions 只执行本地 `npm ci` 与该脚本，不注入密钥或调用云端。

**Tech Stack:** Node.js 20.19.2、npm、Node Test Runner、Vitest、Taro 4.2.0、GitHub Actions。

## Global Constraints

- development、test、production 全部映射到上海地域 `ootd-ai-dev`，不得创建其他 CloudBase 环境。
- 测试数据必须带 `__test__` 标记；自动化清理不得处理没有测试标记的数据。
- 用户、位置、图片均使用虚构或生成数据；测试固定 `Asia/Shanghai` 和确定时间。
- CI 不访问真实 CloudBase、微信开发者工具、天气、LLM 或抠图服务，不保存任何密钥。
- 未经用户再次确认不执行 Git commit 或 push。

---

### Task 1: 固定测试夹具与数据标记

**Files:**
- Create: `tests/m0-05-quality-baseline.test.mjs`
- Create: `tests/fixtures/manifest.json`
- Create: `tests/fixtures/weather-cases.json`
- Create: `tests/fixtures/external-service-cases.json`

**Interfaces:**
- Produces: `fixtureSetId=m0-05-baseline`、固定北京时间、五类天气与成功/超时/限流/无效响应结果。

- [x] 写结构测试，断言夹具目录、固定时区、虚构身份、`__test__` 数据标记和天气/外部服务矩阵。
- [x] 运行 `node --test tests/m0-05-quality-baseline.test.mjs`，确认因夹具文件缺失失败。
- [x] 写入最小脱敏 JSON 夹具。
- [x] 重跑结构测试，确认通过。

### Task 2: 单环境配置与环境变量示例

**Files:**
- Create: `config/environments.json`
- Create: `.env.example`
- Modify: `tests/m0-05-quality-baseline.test.mjs`

**Interfaces:**
- Produces: development/test/production 到 `ootd-ai-dev` 的显式映射及仅含空值/非敏感值的变量清单。

- [x] 先扩展结构测试，断言三阶段环境 ID/地域一致、测试标记固定，并禁止 `.env.example` 出现 Secret/AppSecret 实值。
- [x] 运行结构测试，确认因配置文件缺失失败。
- [x] 写入环境映射和变量名示例，不创建 `.env`。
- [x] 重跑结构测试，确认通过。

### Task 3: 统一质量命令与 GitHub Actions

**Files:**
- Create: `.github/workflows/quality.yml`
- Modify: `package.json`
- Modify: `tests/m0-05-quality-baseline.test.mjs`
- Modify: `TASK.md`
- Modify: `PROGRESS.md`

**Interfaces:**
- Produces: 根脚本 `quality`、`quality:tests`、`quality:types`、`quality:builds` 和 Node 20.19.2 CI 门禁。

- [x] 扩展结构测试，断言工作流使用锁文件安装、运行 `npm run quality`、无云端凭据/部署步骤。
- [x] 运行结构测试，确认因工作流和脚本不存在失败。
- [x] 实现根质量命令及 GitHub Actions 工作流。
- [x] 运行质量门禁各组成命令、`npm run lint`、`npm run build` 与 `git diff --check`。
- [ ] 更新 `TASK.md` 与 `PROGRESS.md`；首次 GitHub Actions 通过后将 M0-05 标记完成并把 M1-01 设为进行中。
