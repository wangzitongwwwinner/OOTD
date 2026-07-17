# M0-03 CloudBase 与共享契约实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可测试的共享 API 契约、CloudBase Node.js 20 云函数入口和数据库集合基线，为后续业务任务提供稳定边界。

**Architecture:** `packages/contracts` 只承载跨端 DTO、稳定错误码、响应信封与运行时校验；`cloudfunctions/api` 作为模块化单体入口，只负责可信身份、路由分发和统一响应。数据库集合与索引使用仓库内声明文件记录，实际创建和权限写入留到获得 CloudBase 外部写入授权后执行。

**Tech Stack:** TypeScript 5.8、Vitest 4、Zod 4、CloudBase Node.js 20.19、`@cloudbase/node-sdk`。

## Global Constraints

- 整个 MVP 仅使用上海地域 `ootd-ai-dev`，不创建其他 CloudBase 环境。
- 客户端不得提交或指定 `userId`；云函数从可信上下文解析身份。
- 接口统一使用成功/失败响应信封，错误码使用稳定大写英文。
- 不部署云函数、不创建集合、不修改云端权限，除非用户另行明确授权。
- 未经用户再次确认不执行 Git commit 或 push。

---

### Task 1: 共享响应契约与数据对象

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/errors.ts`
- Create: `packages/contracts/src/envelope.ts`
- Create: `packages/contracts/src/models.ts`
- Create: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/envelope.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `ApiEnvelope<T>`、`success()`、`failure()`、`ErrorCode` 和 MVP 数据对象类型。

- [x] 先写契约测试，覆盖成功信封、失败信封、稳定错误码和禁止额外字段。
- [x] 运行 `npm run test:contracts`，确认因契约包尚不存在而失败。
- [x] 实现最小契约包与根目录代理命令。
- [x] 运行类型检查和契约测试，确认通过。

### Task 2: CloudBase API 云函数入口

**Files:**
- Create: `cloudfunctions/api/package.json`
- Create: `cloudfunctions/api/tsconfig.json`
- Create: `cloudfunctions/api/src/index.ts`
- Create: `cloudfunctions/api/src/router.ts`
- Create: `cloudfunctions/api/src/context.ts`
- Test: `cloudfunctions/api/src/router.test.ts`
- Create: `cloudbaserc.json`

**Interfaces:**
- Consumes: `ApiEnvelope<T>`、`success()`、`failure()`。
- Produces: `main(event, context)` 和仅用于基线验证的 `GET /health` 路由。

- [x] 先写路由测试，覆盖健康检查、未知路由和客户端伪造 `userId` 不进入可信上下文。
- [x] 运行 `npm run test:cloudfunctions`，确认因入口尚不存在而失败。
- [x] 实现最小路由、身份上下文与 Nodejs20.19 配置。
- [x] 运行云函数类型检查和测试，确认通过。

### Task 3: 数据库集合、索引与权限基线

**Files:**
- Create: `cloudbase/database/collections.json`
- Create: `cloudbase/database/indexes.json`
- Create: `cloudbase/security/functions.json`
- Create: `cloudbase/README.md`
- Test: `tests/m0-03-cloudbase-schema.test.mjs`
- Modify: `TASK.md`
- Modify: `PROGRESS.md`

**Interfaces:**
- Produces: MVP 九个集合的字段/所有权声明、查询索引和默认仅登录用户可调用的函数规则。

- [x] 先写结构测试，断言集合齐全、用户集合唯一索引、行程与推荐查询索引、函数规则包含 `*`。
- [x] 运行结构测试，确认因声明文件尚不存在而失败。
- [x] 写入最小集合、索引和函数权限声明，并明确这些文件不会自动写入云端。
- [x] 运行全部测试、类型检查、格式检查、Web 与微信小程序构建及 `git diff --check`。
- [x] 更新 `TASK.md` 与 `PROGRESS.md`，本地骨架无需云端写入即可标记“已完成”。

## 自检

- 需求覆盖：共享契约、云函数入口、数据集合、索引、权限与单环境约束均有对应任务。
- 无占位实现：M0-03 只建立健康路由与骨架，业务路由明确由后续任务实现。
- 类型一致：云函数只消费契约包公开的响应类型和构造函数。
