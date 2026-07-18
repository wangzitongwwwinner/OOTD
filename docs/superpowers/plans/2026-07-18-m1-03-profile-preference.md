# M1-03 用户资料与体感偏好实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已登录用户范围内完成资料读取与最近整体体感偏好的查询、更新、刷新和并发冲突恢复闭环。

**Architecture:** 小程序只提交稳定枚举和当前版本，云函数从 CloudBase 上下文获取可信 `OPENID` 并映射到当前用户；服务端通过 `version` 做乐观并发控制。客户端复用登录会话中的公开用户摘要作为首屏资料，再以 `GET /v1/profile` 校准，并通过 `PATCH /v1/profile` 更新偏好与会话缓存。

**Tech Stack:** Taro 4.2.0、React 18、TypeScript、Vitest、CloudBase Node.js 20.19、Zod 4。

## Global Constraints

- MVP 仅使用现有环境 `ootd-ai-dev-d6g5hzex6925fcea7`，不创建新环境。
- 体感枚举固定为 `cold/comfortable/stuffy/cool`，UI 映射为偏冷/舒适/闷热/微凉。
- 客户端不得提交或接收 `wechatOpenId`、`openId`、`userId`。
- 昵称和头像在 M1-03 只读取；头像上传、权限帮助、数据清理和退出登录仍归 M8。
- 未经用户再次确认不执行 commit 或 push；云函数重新部署由项目所有者操作。

---

### Task 1: 资料共享契约

**Files:**
- Create: `packages/contracts/src/profile.ts`
- Create: `packages/contracts/src/profile.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/package.json`

**Interfaces:**
- Produces: `profileSchema`、`updateProfileRequestSchema`、`Profile`、`UpdateProfileRequest`。
- `UpdateProfileRequest` 只允许 `{ recentFeelPreference, expectedVersion }`。

- [ ] 写失败测试：公开资料不含微信内部标识；非法枚举、额外身份字段和非正整数版本被拒绝。
- [ ] 运行 `npm run test:contracts`，确认因模块不存在失败。
- [ ] 实现严格 Zod 契约并导出。
- [ ] 运行契约测试与类型检查，确认通过。

### Task 2: 服务端资料用例与路由

**Files:**
- Create: `cloudfunctions/api/src/profile/profile.ts`
- Create: `cloudfunctions/api/src/profile/profile.test.ts`
- Modify: `cloudfunctions/api/src/auth/user-repository.ts`
- Modify: `cloudfunctions/api/src/auth/cloudbase-user-repository.ts`
- Modify: `cloudfunctions/api/src/router.ts`
- Modify: `cloudfunctions/api/src/index.ts`
- Modify: `cloudfunctions/api/package.json`

**Interfaces:**
- Consumes: `TrustedIdentity`、`Profile`、`UpdateProfileRequest`。
- Produces: `GET /v1/profile`、`PATCH /v1/profile`；仓储方法 `findByWechatIdentity()` 与 `updateFeelPreference()`。

- [ ] 写失败测试：当前用户读取、合法更新、非法枚举、伪造身份忽略、未找到和版本冲突。
- [ ] 运行云函数定向测试，确认因资料用例不存在失败。
- [ ] 实现依赖注入用例、异步路由与 CloudBase 乐观更新；冲突返回 `CONFLICT`。
- [ ] 运行云函数测试、类型检查、构建和 `index.main` 冒烟检查。

### Task 3: 客户端资料服务与状态

**Files:**
- Create: `miniprogram/src/features/profile/types.ts`
- Create: `miniprogram/src/features/profile/profile-service.ts`
- Create: `miniprogram/src/features/profile/profile-service.test.ts`
- Create: `miniprogram/src/features/profile/useProfile.ts`
- Create: `miniprogram/src/features/profile/useProfile.test.tsx`
- Modify: `miniprogram/src/features/auth/session-cache.ts`

**Interfaces:**
- Produces: `loadProfile()`、`updateFeelPreference()`、`useProfile()`；更新成功后同步版本化认证会话。

- [ ] 写失败测试：读取成功、更新成功、无效响应、网络失败、冲突后刷新及会话同步。
- [ ] 运行定向测试，确认模块不存在而失败。
- [ ] 实现 Taro 云函数适配器和状态机，错误仅显示用户可理解文案。
- [ ] 运行资料定向测试、全部小程序测试和类型检查。

### Task 4: 体感偏好交互与验收

**Files:**
- Create: `miniprogram/src/features/profile/ProfilePreferenceCard.tsx`
- Create: `miniprogram/src/features/profile/ProfilePreferenceCard.scss`
- Create: `miniprogram/src/features/profile/ProfilePreferenceCard.test.tsx`
- Modify: `miniprogram/src/pages/index/index.tsx`
- Modify: `miniprogram/src/pages/index/index.scss`
- Modify: `TASK.md`
- Modify: `PROGRESS.md`

**Interfaces:**
- Consumes: `useProfile()`。
- Produces: 登录后资料摘要和四项体感偏好更新闭环；不扩展为 M8 用户中心。

- [ ] 写失败组件测试：资料加载、当前选中态、保存禁用、成功反馈、失败重试和冲突刷新。
- [ ] 运行定向测试，确认组件不存在而失败。
- [ ] 实现与现有中性色令牌一致的紧凑资料卡，并接入首页占位。
- [ ] 运行 `npm run quality`、云函数入口冒烟检查、安全扫描和 `git diff --check`。
- [ ] 更新 `TASK.md`、`PROGRESS.md` 为待开发者工具联调，提供重新部署 `api` 与验收步骤。
