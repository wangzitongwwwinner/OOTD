# M6-04 衣物确认入库与浏览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将抠图成功的衣物显式确认入库，并在衣橱页提供正式衣物列表、名称搜索及分类/颜色组合筛选。

**Architecture:** 服务端通过可信微信身份和乐观锁确认 `succeeded` 抠图任务，将对应衣物保持为 `ready` 并返回公开衣物；衣物列表仍由服务端返回当前用户数据，搜索和组合筛选在小程序内完成，避免为最多 500 件的 MVP 数据增加接口复杂度。上传器只负责录入状态，浏览器组件负责列表展示和筛选，两者由衣橱页面编排。

**Tech Stack:** TypeScript、Zod、CloudBase、Taro React、Node test、Vitest。

## Global Constraints

- 不接受客户端 `userId`，所有读取和写入均使用云函数可信微信身份。
- 仅 `succeeded` 任务允许确认；版本不匹配返回 `CONFLICT`。
- 列表和筛选不读取草稿、处理中或失败衣物，只展示 `ready`。
- 搜索匹配名称；分类和颜色为组合筛选；“全部”不写入业务数据。
- 不在本任务实现编辑、删除或搭配引用清理。

---

### Task 1: 确认入库契约与状态机

**Files:**
- Modify: `packages/contracts/src/clothing.ts`
- Modify: `packages/contracts/src/clothing.test.ts`
- Modify: `cloudfunctions/api/src/image-processing/repository.ts`
- Modify: `cloudfunctions/api/src/image-processing/jobs.ts`
- Modify: `cloudfunctions/api/src/image-processing/jobs.test.ts`

**Interfaces:**
- Produces: `confirmCutoutJobRequestSchema`，输入 `{ expectedVersion: number }`。
- Produces: `confirmCutoutJob(id, body, identity, dependencies, requestId)`，返回公开 `Clothing`。
- Consumes: `CutoutJobRepository.confirm(id, expectedVersion, identity)`，返回 `confirmed/not_found/conflict`。

- [ ] **Step 1: Write failing contract and use-case tests**

```ts
assert.equal(confirmCutoutJobRequestSchema.safeParse({ expectedVersion: 2 }).success, true);
const result = await confirmCutoutJob('cutout_1', { expectedVersion: 2 }, identity, deps, 'req');
assert.equal('data' in result && result.data.processingStatus, 'ready');
```

- [ ] **Step 2: Run focused tests and verify missing schema/use case failures**

Run: `node --import tsx --test src/clothing.test.ts` and `node --import tsx --test src/image-processing/jobs.test.ts`.

- [ ] **Step 3: Implement strict schema and repository-backed confirmation**

```ts
const result = await repository.confirm(id, input.data.expectedVersion, identity);
if (result.status === 'not_found') return failure('NOT_FOUND', '抠图任务不存在', false, requestId);
if (result.status === 'conflict') return failure('CONFLICT', '任务状态已更新，请刷新后重试', true, requestId);
return success(clothingSchema.parse(result.clothing), requestId);
```

- [ ] **Step 4: Run focused tests and verify pass**

### Task 2: CloudBase 原子确认与路由

**Files:**
- Modify: `cloudfunctions/api/src/image-processing/cloudbase-job-repository.ts`
- Modify: `cloudfunctions/api/src/image-processing/cloudbase-job-repository.test.ts`
- Modify: `cloudfunctions/api/src/router.ts`
- Modify: `cloudfunctions/api/src/router.test.ts`

**Interfaces:**
- Produces: `POST /v1/image-processing/jobs/:id/confirm`。
- Confirmation requires owner match, job `succeeded`, expected job version, clothing `ready`, and matching `processedFileId`.

- [ ] **Step 1: Write failing owner/version/status tests and route test**

```ts
const response = await routeRequest(
  { method: 'POST', path: '/v1/image-processing/jobs/cutout_1/confirm', body: { expectedVersion: 2 } },
  identity, 'req', undefined, undefined, undefined, undefined, undefined, undefined, clothing, imageProcessing,
);
assert.equal('data' in response && response.data.processingStatus, 'ready');
```

- [ ] **Step 2: Run focused tests and verify failures**

- [ ] **Step 3: Implement owner-isolated optimistic confirmation and route**

Use `where({ id, userId, status: 'succeeded', version: expectedVersion })`; return the matching public clothing only when its processed file matches the job.

- [ ] **Step 4: Run router and repository tests**

### Task 3: Wardrobe service and filters

**Files:**
- Modify: `miniprogram/src/features/wardrobe/clothing-service.ts`
- Modify: `miniprogram/src/features/wardrobe/clothing-service.test.ts`
- Create: `miniprogram/src/features/wardrobe/wardrobe-filters.ts`
- Create: `miniprogram/src/features/wardrobe/wardrobe-filters.test.ts`

**Interfaces:**
- Produces: `confirmCutoutJob(jobId, expectedVersion)` and `listClothing()`。
- Produces: `filterClothing(items, { query, category, color })`。

- [ ] **Step 1: Write failing API and pure-filter tests**

```ts
expect(filterClothing(items, { query: '衬衫', category: 'top', color: '白色' }))
  .toEqual([items[0]]);
```

- [ ] **Step 2: Run focused Vitest and verify failures**

- [ ] **Step 3: Implement API validation and case-insensitive trimmed filtering**

```ts
return items.filter(item =>
  item.processingStatus === 'ready' &&
  (!query || item.name.toLocaleLowerCase().includes(query)) &&
  (!category || item.category === category) &&
  (!color || item.color === color)
);
```

- [ ] **Step 4: Run focused tests**

### Task 4: Confirmation and wardrobe browse UI

**Files:**
- Modify: `miniprogram/src/features/wardrobe/WardrobeUploader.tsx`
- Modify: `miniprogram/src/features/wardrobe/WardrobeUploader.test.tsx`
- Create: `miniprogram/src/features/wardrobe/WardrobeBrowser.tsx`
- Create: `miniprogram/src/features/wardrobe/WardrobeBrowser.test.tsx`
- Modify: `miniprogram/src/pages/wardrobe/index.tsx`
- Modify: `miniprogram/src/pages/wardrobe/index.scss`

**Interfaces:**
- `WardrobeUploader` adds explicit “确认入库” and “重新拍摄” actions after success.
- `WardrobeBrowser` consumes ready clothing and emits search/category/color filter changes.

- [ ] **Step 1: Write failing interaction tests**

```tsx
fireEvent.click(screen.getByRole('button', { name: '确认入库' }));
expect(onConfirm).toHaveBeenCalledTimes(1);
fireEvent.change(screen.getByPlaceholderText('搜索衣物名称'), { target: { value: '衬衫' } });
expect(screen.getByText('白色衬衫')).toBeInTheDocument();
```

- [ ] **Step 2: Run focused tests and verify failures**

- [ ] **Step 3: Implement confirmation refresh and editorial card/filter UI**

On confirmation, call the API once, refresh the ready list, clear uploader state, and show a success message. Keep upload actions disabled while confirming.

- [ ] **Step 4: Run full contracts/cloud/miniprogram tests, type checks, builds and `git diff --check`**

## Self-Review

- Spec coverage: explicit confirmation, ready-only list, name search and category/color combination filters are included.
- Deferred scope: editing, deletion and referenced-node cleanup remain separate M6 tasks.
- Security: identity and ownership stay server-side; public responses use existing clothing schema.
- Type consistency: confirmation uses job version; list returns `PublicClothing[]`; filters operate only on public clothing.
