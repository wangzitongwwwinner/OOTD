# React 原型还原、建议评价与发布实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 严格将已确认 React 原型迁移到 Taro 小程序，在视觉验收通过后增加 AI 穿衣建议评价卡片，最后重新生成体验版并完成审核、发布。

**Architecture:** 保留现有 CloudBase、服务契约和业务状态，只调整 Taro 页面结构、样式与必要展示状态；根目录 React 原型保持只读。评价能力使用稳定 `recommendationId` 和可信服务端身份写入 `recommendationFeedbacks`，并接入现有指标报告。已上传的 `0.9.0` 仅作为开发快照。

**Tech Stack:** Taro 4.2.0、React 18、TypeScript、SCSS、Vitest、CloudBase、微信开发者工具 CLI。

## Global Constraints

- UI 单一基线：`src/components/`、`src/index.css`、`DESIGN.md`。
- 产品范围继续遵守 `PRODUCT.md`，不恢复已取消的数据重置等原型功能。
- 一级导航固定：首页、场景库、衣橱、试穿；用户中心由首页头像进入。
- 覆盖 375–414px，页面左右边距 24px，遵循 8px 间距节奏。
- 每组页面先完成自动化门禁，再进行 Android 真机视觉验收。
- 原型还原未验收前不开发评价卡片；评价未验收前不上传审核候选。
- 上传、部署、提审、发布、commit 和 push 均需项目所有者单独授权。

---

### Task 1: 全局视觉令牌与导航

**Files:**
- Modify: `miniprogram/src/styles/tokens.scss`
- Modify: `miniprogram/src/app.scss`
- Modify: `miniprogram/src/app.config.ts`
- Create: `miniprogram/src/components/AppTabBar/AppTabBar.tsx`
- Create: `miniprogram/src/components/AppTabBar/AppTabBar.scss`
- Test: `miniprogram/src/components/AppTabBar/AppTabBar.test.tsx`

- [ ] 写失败测试，覆盖四项导航、选中态、图标、底部安全区和固定 24px 页面边距。
- [ ] 运行定向测试确认失败。
- [ ] 补齐 Canvas、Onyx Wool、Warm Taupe、Pebble、Camel、serif/sans、圆角与阴影令牌。
- [ ] 用原型一致的自定义玻璃感导航呈现四项路由。
- [ ] 运行测试、类型、Lint、格式和微信生产构建。

### Task 2: 登录页与首页还原

**Files:**
- Modify: `miniprogram/src/features/auth/LoginPage.tsx`
- Modify: `miniprogram/src/features/auth/LoginPage.scss`
- Modify: `miniprogram/src/pages/index/index.tsx`
- Modify: `miniprogram/src/pages/index/index.scss`
- Modify: `miniprogram/src/features/weather/WeatherCard.tsx`
- Modify: `miniprogram/src/features/weather/WeatherCard.scss`
- Modify: `miniprogram/src/features/recommendation/RecommendationCard.tsx`
- Modify: `miniprogram/src/features/recommendation/RecommendationCard.scss`
- Test: corresponding `*.test.tsx`

- [ ] 写失败测试，覆盖居中品牌秩序、唯一微信登录入口、协议确认、品牌顶栏、头像入口及天气→建议→行程顺序。
- [ ] 删除原型没有的英文眉题，恢复居中 Logo、标题、价值文案和微信绿色主按钮。
- [ ] 还原首页半透明顶栏、大温度天气卡、只读城市胶囊、深色建议卡和紧凑行程列表。
- [ ] 回归登录、定位、天气刷新、建议生成和行程增删改。
- [ ] 完成 Android 登录页与首页视觉验收。

### Task 3: 场景库与衣橱还原

**Files:**
- Modify: `miniprogram/src/features/scenes/SceneList.tsx`
- Modify: `miniprogram/src/features/scenes/SceneList.scss`
- Modify: `miniprogram/src/features/scenes/SceneForm.tsx`
- Modify: `miniprogram/src/features/scenes/SceneForm.scss`
- Modify: `miniprogram/src/pages/wardrobe/index.tsx`
- Modify: `miniprogram/src/pages/wardrobe/index.scss`
- Modify: `miniprogram/src/features/wardrobe/WardrobeBrowser.tsx`
- Modify: `miniprogram/src/features/wardrobe/WardrobeUploader.tsx`
- Test: corresponding `*.test.tsx`

- [ ] 写失败测试，覆盖场景卡片层级、底部弹层、衣橱搜索筛选、两列图片网格和上传状态。
- [ ] 还原场景标题、卡片、标签、低权重操作与移动端底部弹层。
- [ ] 还原衣橱搜索筛选、图片容器、上传指南、处理对比、编辑和删除层级。
- [ ] 运行定向测试及完整小程序门禁。
- [ ] 完成 Android 场景库与衣橱视觉验收。

### Task 4: 试穿与用户中心还原

**Files:**
- Modify: `miniprogram/src/pages/try-on/index.tsx`
- Modify: `miniprogram/src/pages/try-on/index.scss`
- Modify: `miniprogram/src/features/try-on/OutfitManager.tsx`
- Modify: `miniprogram/src/features/try-on/OutfitManager.scss`
- Modify: `miniprogram/src/pages/profile/index.tsx`
- Modify: `miniprogram/src/pages/profile/index.scss`
- Modify: `miniprogram/src/features/profile/ProfileCenter.tsx`
- Modify: `miniprogram/src/features/profile/ProfileCenter.scss`
- Test: corresponding `*.test.tsx`

- [ ] 写失败测试，覆盖“试衣间/我的搭配”分段、留白画板、保存载入，以及用户中心返回栏、头像资料区和分组列表。
- [ ] 将当前画板与搭配列表纵向堆叠改成原型分段切换，数据模型保持不变。
- [ ] 恢复 24px 边距、编辑式标题、轻量工具条和保存成功流转。
- [ ] 还原用户中心顶栏、资料头图、分组设置卡和图标；保留已确认的“账号与数据说明”，不恢复数据重置。
- [ ] 完成 Android 手势回归与视觉验收。

### Task 5: 原型还原总验收

**Files:**
- Modify: `TEST.md`
- Modify: `PROGRESS.md`

- [ ] 在 375px、390px、414px 核对六个页面与导航。
- [ ] 覆盖加载、空、错、成功、禁用和底部安全区。
- [ ] 运行 `npm run quality` 与 `git diff --check`。
- [ ] Android 真机逐页截图对照；iOS 继续记录为设备覆盖缺口。
- [ ] 只有项目所有者明确确认视觉验收通过，才启动评价任务。

### Task 6: AI 建议评价契约与云端存储

**Files:**
- Create: `packages/contracts/src/recommendation-feedback.ts`
- Create: `packages/contracts/src/recommendation-feedback.test.ts`
- Create: `cloudfunctions/api/src/recommendation/feedback-repository.ts`
- Create: `cloudfunctions/api/src/recommendation/cloudbase-feedback-repository.ts`
- Create: `cloudfunctions/api/src/recommendation/manage-feedback.ts`
- Create: `cloudfunctions/api/src/recommendation/manage-feedback.test.ts`
- Modify: `cloudfunctions/api/src/router.ts`
- Modify: `cloudfunctions/api/src/index.ts`

- [ ] 写失败契约测试，拒绝客户端 `userId`、未知评价和额外字段。
- [ ] 写失败用例，覆盖推荐所有权、首次保存、修改、重复幂等和版本冲突。
- [ ] 实现 `PUT /v1/recommendations/:id/feedback`，只接受 `helpful | neutral | unhelpful`。
- [ ] 增加 `recommendationFeedbacks` 集合、`userId + recommendationId` 唯一约束和仅云函数访问规则。
- [ ] 运行契约、云函数测试、类型检查和构建；获得授权后部署。

### Task 7: AI 建议评价卡片与指标

**Files:**
- Create: `miniprogram/src/features/recommendation/RecommendationFeedback.tsx`
- Create: `miniprogram/src/features/recommendation/RecommendationFeedback.scss`
- Create: `miniprogram/src/features/recommendation/RecommendationFeedback.test.tsx`
- Create: `miniprogram/src/features/recommendation/feedback-service.ts`
- Create: `miniprogram/src/features/recommendation/feedback-service.test.ts`
- Modify: `miniprogram/src/features/recommendation/RecommendationCard.tsx`
- Modify: `cloudfunctions/api/src/metrics/calculate-metrics.ts`
- Modify: `cloudfunctions/api/src/metrics/render-metric-report.ts`
- Test: corresponding metrics tests

- [ ] 写失败组件测试，覆盖未评价、提交中、成功选中、失败重试和修改评价。
- [ ] 在首页 AI 建议卡底部增加“有帮助 / 一般 / 没帮助”。
- [ ] 防重复点击；失败保留选择并可重试；修改评价更新原记录。
- [ ] 写失败指标夹具并实现有用率、正向反馈率和评价覆盖率。
- [ ] 完成 Android 重复点击、弱网、失败恢复、修改评价及统计回归。

### Task 8: 新体验版、审核与发布

**Files:**
- Modify: `TASK.md`
- Modify: `PROGRESS.md`
- Modify: `WECHAT_MINIPROGRAM.md` only if platform facts change

- [ ] 重新运行全部测试、类型、Lint、格式、生产构建、包体与差异检查。
- [ ] 经授权 commit/push，并上传高于 `0.9.0` 的新开发版本。
- [ ] 设置体验版与体验成员，回归登录、定位、天气、建议、评价、行程、场景、衣橱、试穿、搭配和退出登录。
- [ ] 确认类目、隐私指引、协议、版本说明和审核测试路径。
- [ ] 分别获得授权后提交审核、处理反馈并正式发布。
