# 飞书项目文档访问指引

> 本文用于指导 Agent 和开发者定位、读取与维护“穿衣有数”项目的飞书文档。产品事实仍以 [PRODUCT.md](./PRODUCT.md) 为仓库内单一来源；飞书 PRD 文档用于补充需求背景、原型截图与页面细节。

## 1. 项目飞书文档

| 文档 | 用途 | 链接 |
|---|---|---|
| 【PRD】穿衣有数 | 查看原始产品背景、用户问题、需求推导与完整 PRD | [打开产品背景版](https://qcn270o4wvg1.feishu.cn/docx/QZ9SdL9xGoUMQBxfrpXckTiLnZc) |
| 【PRD】穿衣有数 | 查看最终原型截图、一级页面、次级弹层、交互状态与开发边界 | [打开 MVP 页面说明版](https://qcn270o4wvg1.feishu.cn/docx/ZFLEd1bUvok51bxKARAc18xzntg) |

## 2. 信息使用顺序

Agent 开始产品或开发任务时按以下顺序判断：

1. 用户当前对话中的最新明确指令。
2. 仓库 [PRODUCT.md](./PRODUCT.md) 中已固化的 MVP 产品事实。
3. 仓库 [DESIGN.md](./DESIGN.md) 与飞书“页面说明与开发指引”中的视觉、页面和交互细节。
4. 飞书 PRD 中的背景、分析和未被仓库文档覆盖的需求上下文。
5. [ARCHITECTURE.md](./ARCHITECTURE.md)、[DEVELOPMENT.md](./DEVELOPMENT.md)、[TEST.md](./TEST.md) 与 [TASK.md](./TASK.md)。
6. 当前代码表现。

若飞书 PRD、页面说明与仓库文档冲突，不得自行覆盖高优先级事实；应记录冲突并向用户确认。

## 3. CLI 环境

CLI 为全局安装：

```text
C:\Users\user\AppData\Roaming\npm\lark-cli
```

配置和登录状态位于：

```text
C:\Users\user\.lark-cli\
├── config.json
├── cache\
└── logs\
```

若新会话提示找不到命令，先确认以下目录在 `PATH` 中：

```text
C:\Users\user\AppData\Roaming\npm
```

PowerShell 中也可以直接调用：

```powershell
& "C:\Users\user\AppData\Roaming\npm\lark-cli.cmd" --help
```

## 4. 登录和状态检查

读取用户个人云文档应使用用户身份：

```powershell
lark-cli auth status --json --verify
lark-cli whoami
```

首次登录或授权过期时：

```powershell
lark-cli auth login --domain docs --domain drive
```

不得输出或提交 AppSecret、Access Token、Refresh Token 以及 `C:\Users\user\.lark-cli\` 内的缓存文件。

## 5. 查找与读取

按标题查找项目文档：

```powershell
lark-cli drive +search --query "穿衣有数" --doc-types docx,wiki --page-size 20 --sort edit_time --as user
```

读取 PRD：

```powershell
lark-cli docs +fetch --doc "https://qcn270o4wvg1.feishu.cn/docx/QZ9SdL9xGoUMQBxfrpXckTiLnZc" --as user
```

读取页面说明：

```powershell
lark-cli docs +fetch --doc "https://qcn270o4wvg1.feishu.cn/docx/ZFLEd1bUvok51bxKARAc18xzntg" --as user
```

大型文档优先局部读取：

```powershell
# 查看目录
lark-cli docs +fetch --doc "<URL或token>" --scope outline --max-depth 3 --as user

# 按关键词读取
lark-cli docs +fetch --doc "<URL或token>" --scope keyword --keyword "衣物录入" --context-before 1 --context-after 2 --as user

# 精确编辑前获取 block ID
lark-cli docs +fetch --doc "<URL或token>" --scope section --start-block-id "<block_id>" --detail with-ids --as user
```

## 6. 修改约束

- 只读任务不得修改飞书文档。
- 写入、上传截图、删除区块或调整权限前必须获得用户明确授权。
- 精确修改优先使用 `block_replace`、`block_insert_after`、`block_move_after` 或 `block_delete`，避免全量覆盖。
- 修改前读取目标章节及 block ID；修改后重新读取同一章节验证。
- 图片使用 `docs +media-insert` 上传，再移动到目标位置；替换图片时确认新图可读后再删除旧图。
- 产品事实变化需同步更新 `PRODUCT.md`；设计变化更新 `DESIGN.md`；实施状态变化更新 `PROGRESS.md`。

常用帮助命令：

```powershell
lark-cli docs +fetch --help
lark-cli docs +update --help
lark-cli docs +media-insert --help
lark-cli drive +search --help
```
