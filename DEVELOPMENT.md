# 穿衣有数｜开发规范

> 本文定义 MVP 生产开发的工程约束。产品边界见 [PRODUCT.md](./PRODUCT.md)，视觉规范见 [DESIGN.md](./DESIGN.md)，技术结构见 [ARCHITECTURE.md](./ARCHITECTURE.md)，微信平台流程见 [WECHAT_MINIPROGRAM.md](./WECHAT_MINIPROGRAM.md)，测试门禁见 [TEST.md](./TEST.md)。

## 1. 开发目标与原则

- 目标产物是微信小程序，不把当前 React/Vite 浏览器原型直接当作生产代码。
- 以当前原型为 UI 与交互基线，迁移时复用产品结构、视觉令牌、领域类型和可验证业务规则。
- 采用模块化单体和清晰分层；MVP 不拆微服务。
- 测试先行，小步交付；每个任务必须有独立可验证结果。
- 外部服务全部经过服务端适配层，前端不得直连天气、LLM 或抠图供应商。

## 2. 技术栈

### 2.1 生产小程序前端

- Taro 3.x、React 18、TypeScript 5.x。
- 构建目标优先为微信小程序；不为未确认的平台提前加入兼容代码。
- 样式使用 SCSS/CSS Modules 与设计令牌；禁止依赖浏览器专属 DOM、远程字体和 Google 图标字体。
- 状态分为页面局部状态、会话状态和服务端数据状态；简单场景使用 React Context/Hooks，出现跨页缓存需求后再引入轻量查询层，不预装大型状态框架。
- 表单和接口边界使用共享 TypeScript 类型；运行时输入必须校验。

### 2.2 后端

- 腾讯云开发 CloudBase：Node.js 20 云函数、文档型数据库、云存储。
- 云函数按业务域组织，通过 `@cloudbase/node-sdk` 访问数据库与存储。
- 外部服务适配器：天气、LLM、图片抠图、短信。供应商由环境配置决定，领域层不依赖供应商 SDK。
- 后台耗时任务用于抠图；客户端通过任务状态轮询或受控订阅获取结果。

### 2.3 工具与质量

- 包管理器统一使用 npm，并提交 `package-lock.json`。
- ESLint、Prettier、TypeScript strict、Vitest、React Testing Library。
- 微信开发者工具用于真机预览、权限与兼容验证。
- 微信开发者工具还用于导入 Taro 微信输出目录、选择基础库、质量检查、预览、真机调试和上传；不能只用浏览器完成验收。
- 原型继续保留 Vite/Express 作为迁移参照，生产目录建立后不得把原型模拟接口混入生产云函数。

依赖升级必须单独评审；文档中的大版本代表基线，精确版本以锁文件为准。

### 2.4 微信项目配置

- `project.config.json` 提交共享配置，`project.private.config.json` 仅限本机并加入 `.gitignore`。
- Taro 的 `outputRoot` 必须与微信开发者工具导入目录一致。
- 最低基础库版本在 M0 技术验证后固定，不能长期使用“最新版”作为不可复现配置。
- `AppID` 可用于项目识别；`AppSecret`、上传私钥和开发者工具登录态不得进入仓库。
- 本地可临时关闭域名校验用于排障，但发布测试必须开启真实校验。
- 当前 MVP 的所有构建显式使用上海地域的 `ootd-ai-dev`。由于没有环境级隔离，测试数据必须带可识别标记，自动化清理不得影响无测试标记的数据，发布前执行测试数据和调试配置清理门禁。

## 3. 建议目录

```text
.
├── prototype/                 # 迁移稳定后收纳当前 React/Vite 原型
├── miniprogram/
│   ├── config/
│   └── src/
│       ├── app.config.ts
│       ├── app.tsx
│       ├── assets/
│       ├── components/       # 跨页面通用 UI
│       ├── features/         # 按业务域组织
│       │   ├── auth/
│       │   ├── weather/
│       │   ├── itinerary/
│       │   ├── scenes/
│       │   ├── wardrobe/
│       │   ├── try-on/
│       │   └── profile/
│       ├── pages/            # 路由页面，仅做编排
│       ├── services/         # API 客户端和小程序能力封装
│       ├── store/            # 会话与必要跨页状态
│       ├── styles/           # 令牌、全局样式、mixins
│       ├── types/
│       └── utils/
├── cloudfunctions/
│   ├── auth/
│   ├── weather/
│   ├── recommendation/
│   ├── scenes/
│   ├── itineraries/
│   ├── clothing/
│   ├── image-processing/
│   ├── outfits/
│   └── profile/
├── packages/
│   └── contracts/            # 前后端共享 DTO、错误码与校验 schema
└── tests/
    ├── contract/
    ├── fixtures/
    └── e2e/
```

路由页面不承载复杂业务规则；业务逻辑放在 `features`，外部调用放在 `services`，云函数入口只负责鉴权、校验、调用用例和封装响应。

## 4. 文件与命名

- React 组件、页面、类型：`PascalCase`，例如 `WeatherCard.tsx`、`SceneForm.tsx`。
- Hooks：`useXxx.ts`，例如 `useTodayItinerary.ts`。
- 普通模块、服务和测试：`kebab-case`，例如 `weather-service.ts`、`weather-service.test.ts`。
- 变量和函数：`camelCase`；布尔值使用 `is/has/can/should` 前缀。
- 常量：`UPPER_SNAKE_CASE`；枚举值使用可序列化英文稳定值，中文仅用于展示。
- 事件回调：组件属性使用 `onXxx`，内部处理函数使用 `handleXxx`。
- 数据库集合使用复数小写名；字段使用 `camelCase`。
- 一个文件一个主要职责；业务组件超过约 300 行或同时承担三种职责时拆分。

禁止使用 `data1`、`tempObj`、`handleThing` 等无语义命名；禁止把供应商名写进领域模型。

## 5. TypeScript 与代码规则

- 开启 `strict`、`noUncheckedIndexedAccess` 和 `exactOptionalPropertyTypes`。
- 禁止新增 `any`；外部输入先作为 `unknown`，校验后再使用。
- DTO 与领域对象分离；日期通过 ISO 8601 字符串传输，服务端统一按 `Asia/Shanghai` 解释“当天”。
- 金额、时间、温度等带单位字段在名称或类型中明确单位，如 `durationMinutes`、`temperatureCelsius`。
- 业务函数优先纯函数；副作用集中在服务和用例边界。
- 不吞异常，不把原始异常、堆栈或供应商错误直接展示给用户。
- 日志使用结构化字段，必须脱敏手机号、定位、Token 和图片地址。

## 6. 组件与样式

- 页面结构、文案含义、交互状态必须符合 [DESIGN.md](./DESIGN.md) 和飞书页面说明。
- 视觉值优先使用令牌，不在页面中散落重复颜色和间距。
- 所有交互组件覆盖默认、按下、禁用、加载、错误和必要成功状态。
- 触控目标不小于约 `40 × 40px`，底部弹层适配安全区和键盘。
- 图片必须设置尺寸策略、加载态和失败占位；头像与衣物图不得依赖临时外链。
- 自由试穿使用小程序可支持的触摸事件和坐标系统，不依赖浏览器 DOM 变换测量。

## 7. 数据与状态

- 服务端是用户业务数据的事实来源；本地缓存只用于会话、性能和离线恢复。
- 缓存必须包含版本、过期时间和用户隔离键；退出登录时清理敏感缓存。
- 写操作使用服务端生成 ID、所有权校验和幂等键。
- 场景删除、衣物删除与搭配引用变更必须在事务或等价原子流程中完成。
- 保存试穿搭配时统一画布坐标，避免不同设备尺寸导致恢复偏移。

## 8. 接口规范

### 8.1 路径与方法

```text
POST   /v1/auth/wechat/login
POST   /v1/auth/sms/send
POST   /v1/auth/sms/login
GET    /v1/weather/current
POST   /v1/recommendations
GET    /v1/scenes
POST   /v1/scenes
PATCH  /v1/scenes/:id
DELETE /v1/scenes/:id
GET    /v1/itineraries/today
POST   /v1/itineraries
PATCH  /v1/itineraries/:id
DELETE /v1/itineraries/:id
GET    /v1/clothing
POST   /v1/clothing/uploads
POST   /v1/image-processing/jobs
GET    /v1/image-processing/jobs/:id
PATCH  /v1/clothing/:id
DELETE /v1/clothing/:id
GET    /v1/outfits
POST   /v1/outfits
GET    /v1/outfits/:id
DELETE /v1/outfits/:id
GET    /v1/profile
PATCH  /v1/profile
```

云函数可以在内部映射这些逻辑路径；共享契约必须保持一致。

### 8.2 响应信封

成功：

```json
{
  "data": {},
  "requestId": "req_xxx"
}
```

失败：

```json
{
  "error": {
    "code": "SCENE_NOT_FOUND",
    "message": "场景不存在或已删除",
    "retryable": false
  },
  "requestId": "req_xxx"
}
```

- HTTP 状态表达协议结果，业务错误码使用稳定大写英文。
- 分页使用 `cursor` 和 `nextCursor`；禁止使用不稳定页码处理会变化的列表。
- 客户端写请求传 `Idempotency-Key`；重试只用于明确可重试且幂等的操作。
- 天气、LLM、抠图设置独立超时；推荐服务目标 5 秒内返回，抠图任务目标 10 秒内完成。
- 接口变更先改 `packages/contracts` 和契约测试，再改前后端。

## 9. 安全与隐私

- AppSecret、供应商密钥只存在于服务端环境变量或密钥管理中。
- 所有云函数从可信上下文获取用户身份，不接受客户端自报 `userId`。
- 定位只保存满足业务所需的城市级信息；不得记录精确经纬度日志。
- 图片上传使用短期凭证、类型和大小校验；处理完成后按生命周期清理临时原图。
- 短信发送实施图形/行为风控、频率限制和手机号脱敏。
- 数据清理、退出登录和删除操作必须二次确认并具备审计记录。

## 10. Git、评审与完成定义

- 分支默认从 `main` 创建，Agent 分支使用 `codex/<topic>`。
- 未经用户确认不得提交或推送。
- 提交聚焦单一任务，使用简洁中文提交信息。
- PR 必须说明需求来源、变更范围、测试证据、截图和风险。
- 完成定义：需求验收通过、测试通过、类型与构建通过、无敏感信息、文档与进度同步、无未解释警告。
