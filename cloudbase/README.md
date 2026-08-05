# CloudBase 配置基线

本目录记录 `ootd-ai-dev` 的数据库、索引和安全规则目标状态，只作为可审查的配置声明，不会自动创建集合或修改云端权限。

## 文件职责

- `database/collections.json`：九个 MVP 业务与基础设施集合的字段基线。
- `database/indexes.json`：后续查询链路所需的复合索引与唯一约束。
- `security/functions.json`：云函数调用默认要求已登录且非匿名身份。
- `security/database.json`：客户端禁止直接读取或写入数据库，统一经过云函数鉴权和所有权校验。

## 应用流程

实际写入 `ootd-ai-dev` 前，Agent 必须再次获得项目所有者授权。授权后由项目所有者或 Agent 在 CloudBase 控制台逐项创建集合、索引和安全规则，并在同一环境中使用带测试标记的数据验收；不得创建新的测试或生产环境。

函数级安全规则依据 CloudBase 官方 JSON 结构；数据库规则需在每个集合的“权限管理 → 自定义安全规则”中应用 `read: false`、`write: false`。服务端云函数仍保有数据库访问能力。
