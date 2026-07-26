# M7 搭配持久化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户保存自由画布搭配，并能查询、重新载入和删除自己的搭配。

**Architecture:** 共享契约负责严格校验公开搭配与写入请求；CloudBase 云函数通过可信微信身份校验衣物所有权并持久化归一化节点；小程序只提交名称、标签和画布节点，载入后使用现有坐标模型恢复。

**Tech Stack:** TypeScript、Taro 4.2.0、React 18、CloudBase Node.js 20、Node test、Vitest。

## Global Constraints

- 自由画布不显示人体轮廓或固定分区。
- 节点坐标保存为 `0～1` 归一化值，缩放限制为 `0.3～3`。
- 服务端仅信任平台微信身份，并校验全部 `clothingId` 属于当前用户。
- 服务端是搭配事实来源；不使用浏览器或小程序本地存储替代。
- iOS 真机因当前无设备标记为未执行，不伪造验收结论。
- 未经用户再次确认，不提交、不推送、不部署。

---

### Task 1: 搭配共享契约

**Files:**
- Create: `packages/contracts/src/outfit.ts`
- Create: `packages/contracts/src/outfit.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces: `OutfitNodeSchema`、`CreateOutfitRequestSchema`、`PublicOutfitSchema`、`OutfitListSchema`。

- [x] **Step 1: 写失败测试**

测试合法节点和搭配通过；空名称、额外 `userId`、越界坐标/缩放、重复衣物节点被拒绝；公开响应不得包含 `userId`。

- [x] **Step 2: 确认失败**

Run: `npm --prefix packages/contracts test`

Expected: FAIL，原因是 `outfit.ts` 或导出不存在。

- [x] **Step 3: 最小实现**

使用现有契约的手写严格解析风格，输出：

```ts
interface CreateOutfitRequest {
  name: string;
  seasonTags: string[];
  colorTags: string[];
  canvasVersion: 1;
  nodes: Array<{
    clothingId: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    zIndex: number;
  }>;
}
```

- [x] **Step 4: 验证转绿**

Run: `npm --prefix packages/contracts test`

Expected: 全部契约测试通过。

### Task 2: 云函数保存与查询

**Files:**
- Create: `cloudfunctions/api/src/outfits/repository.ts`
- Create: `cloudfunctions/api/src/outfits/manage-outfits.ts`
- Create: `cloudfunctions/api/src/outfits/manage-outfits.test.ts`
- Create: `cloudfunctions/api/src/outfits/cloudbase-outfit-repository.ts`
- Modify: `cloudfunctions/api/src/router.ts`
- Modify: `cloudfunctions/api/src/context.ts`

**Interfaces:**
- Consumes: Task 1 搭配契约。
- Produces: `GET /v1/outfits`、`POST /v1/outfits`、`GET /v1/outfits/:id`。

- [x] **Step 1: 写失败测试**

覆盖可信身份保存、衣物不属于用户时拒绝、列表/详情不泄露身份、仓储失败使用友好错误。

- [x] **Step 2: 确认失败**

Run: `npm --prefix cloudfunctions/api test`

Expected: FAIL，原因是搭配用例和路由尚不存在。

- [x] **Step 3: 最小实现**

仓储创建时生成 ID、时间和版本；所有查询按 `appId + openId` 隔离；保存前批量验证节点衣物均为当前用户 `ready` 衣物。

- [x] **Step 4: 验证转绿**

Run: `npm --prefix cloudfunctions/api test`

Expected: 全部云函数测试通过。

### Task 3: 小程序保存与重新载入

**Files:**
- Create: `miniprogram/src/features/try-on/outfit-service.ts`
- Create: `miniprogram/src/features/try-on/outfit-service.test.ts`
- Create: `miniprogram/src/features/try-on/OutfitManager.tsx`
- Create: `miniprogram/src/features/try-on/OutfitManager.test.tsx`
- Modify: `miniprogram/src/pages/try-on/index.tsx`
- Modify: `miniprogram/src/pages/try-on/index.scss`

**Interfaces:**
- Consumes: Task 2 的三个接口和现有 `OutfitNode` 坐标模型。
- Produces: 保存防重、搭配列表、载入恢复、错误重试。

- [ ] **Step 1: 写失败测试**

覆盖空画布/空名称阻止保存、重复提交禁用、保存成功提示、列表加载、载入节点和失败重试。

- [ ] **Step 2: 确认失败**

Run: `npm --prefix miniprogram test`

Expected: FAIL，原因是服务和管理组件不存在。

- [ ] **Step 3: 最小实现**

保存时将页面节点映射为契约节点并固定 `rotation: 0`、`canvasVersion: 1`；载入时用衣物 ID 与当前衣橱关联，缺失衣物节点由服务端一致性规则处理。

- [ ] **Step 4: 验证转绿**

Run: `npm --prefix miniprogram test`

Expected: 全部小程序测试通过。

### Task 4: 删除、联动与验收

**Files:**
- Create: `cloudfunctions/api/src/outfits/delete-outfit.test.ts`
- Create: `cloudfunctions/api/src/outfits/delete-outfit.ts`
- Modify: `cloudfunctions/api/src/clothing/delete-clothing.ts`
- Modify: `cloudfunctions/api/src/outfits/cloudbase-outfit-repository.ts`
- Modify: `miniprogram/src/features/try-on/OutfitManager.tsx`
- Modify: `PROGRESS.md`

**Interfaces:**
- Produces: `DELETE /v1/outfits/:id`，以及确认删除衣物后原子移除相关搭配节点。

- [ ] **Step 1: 写失败测试**

覆盖删除搭配版本冲突、重复提交，以及删除被引用衣物后全部相关节点同步移除。

- [ ] **Step 2: 确认失败**

Run: `npm run quality:tests`

Expected: FAIL，原因是删除和事务联动缺失。

- [ ] **Step 3: 最小实现**

在 CloudBase 事务中按可信身份删除搭配；衣物删除事务同时更新匹配 `nodes.clothingId` 的搭配。

- [ ] **Step 4: 完整验证**

Run: `npm run quality`

Expected: 测试、类型、格式和三类构建全部通过；随后执行 Android 真机保存、重新打开、删除和跨尺寸模拟器验收。
