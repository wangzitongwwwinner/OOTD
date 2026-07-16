---
name: Urban Wardrobe Narrative
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#4d4540'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#7e756f'
  outline-variant: '#cfc4bd'
  primary: '#181512'
  on-primary: '#ffffff'
  primary-container: '#2d2926'
  on-primary-container: '#96908b'
  secondary: '#685c50'
  on-secondary: '#ffffff'
  secondary-container: '#f0e0d0'
  on-secondary-container: '#6e6256'
  tertiary: '#161612'
  on-tertiary: '#ffffff'
  error: '#ba1a1a'
  error-container: '#ffdad6'
  background: '#faf9f7'
  on-background: '#1a1c1b'
typography:
  display-serif:
    fontFamily: Noto Serif SC
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Noto Serif SC
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-main:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-page: 24px
  gutter-grid: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 48px
---

# 穿衣有数｜最终原型设计规范

> 当前 React 原型是 MVP 的确定 UI 方案。后续前端实现应保持本文件定义的视觉语言、页面结构和优先级，不重新采用旧原型风格。含截图的完整页面与次级弹层说明见 [FEISHU_DOCS.md](./FEISHU_DOCS.md) 中的“页面说明与开发指引”。

## 1. 品牌与风格

产品面向重视效率与质感的城市通勤用户。整体人格是 **Sophisticated、Warm、Calm（精致、温暖、平静）**，像一次安静的穿衣对话，而不是机械工具。

视觉方向采用 **Modern Editorial Minimalism（现代编辑式极简）**：参考高端生活方式杂志、天然织物与建筑空间，通过大面积留白、清晰文字层级、低饱和色和柔和过渡降低认知负担。

视觉质量优先级高。任何新增页面和状态必须先复用当前原型的颜色、字体、间距、形状和组件表达，禁止因开发便利引入默认后台模板风格。

## 2. 颜色

- 主色 `#2D2926`：Onyx Wool，深软炭色；用于主文字和高对比控件，避免纯黑。
- 次色 `#A7998B` / `#685C50`：Warm Taupe，用于次标题、图标和辅助信息。
- 边界色 `#E5E1DA`：Pebble，用于细边框、分隔线和禁用态。
- 背景 `#F9F8F6` / `#FAF9F7`：Canvas，作为温暖的页面底色。
- 点缀 `#D4A373` / `#F0E0D0`：Camel，仅用于推荐、激活或轻量提示。
- 错误色使用 `#BA1A1A`，避免大面积高饱和红色。

整体保持低饱和。交互状态优先使用透明度、细边框和轻微色阶变化，不使用攻击性的高亮。

## 3. 字体

- 情绪标题、天气数字和“穿衣有数”等核心标题：`Noto Serif SC`，无该字体时使用系统中文宋体。
- 中文正文与控件：`PingFang SC` 或系统无衬线字体。
- 拉丁文字和数据：`Plus Jakarta Sans` / `Inter`。
- 信息层级依次为：32px展示标题、24px页面标题、18px区块标题、16px正文、14px辅助正文、12px标签。
- 英文仅用于必要的结构或品牌内容，不作无意义装饰。

## 4. 布局与间距

- 设计基准宽度为微信小程序常见的 375–414pt。
- 页面左右边距固定 24px。
- 所有间距遵循 8px 节奏。
- 主要区块之间使用 32–48px 垂直距离。
- 允许轻度非对称布局以形成编辑感，但不得影响信息顺序和触控效率。
- 页面内容必须为底部导航和安全区预留空间。
- 触控目标不小于约 40×40px。

## 5. 层级、形状与图标

- 主要依靠色阶表达层级；卡片通常为白色，页面为 Canvas 背景。
- 阴影仅在必要浮层使用，建议 `0 4px 20px rgba(45, 41, 38, 0.05)`。
- 卡片使用约 16px 圆角；衣物图片容器使用约 24px；输入和次级按钮使用约 8px。
- 胶囊形状仅用于状态、筛选和紧凑操作，不把所有控件做成胶囊。
- 图标使用 1.5pt 左右的圆角线性风格，保持视觉尺寸一致。
- 底部导航使用轻微玻璃模糊，四项等分排列。

## 6. 核心组件

### 6.1 编辑式卡片

穿衣建议等核心内容使用大尺寸卡片、清晰文字层级和克制的图像/渐变遮罩。卡片信息优先，装饰不得遮挡操作。

### 6.2 操作按钮

- 主要按钮：Primary 实色、高对比文字、约 8px 圆角或当前原型确认的圆角。
- 次要按钮：透明/浅色背景、Pebble 细边框、Primary 文字。
- 加载时禁用重复点击并显示明确进度。

### 6.3 标签与筛选

天气属性、衣物类别和状态使用小型胶囊标签，背景采用次色约 10% 透明度。

### 6.4 列表与衣物槽位

- 列表使用不贯穿全屏的细分隔线。
- 衣物卡使用方形或轻微纵向容器、24px 圆角和中性背景，让衣物纹理成为主体。

## 7. 页面规范

### 7.1 登录页

- 展示本地产品 Logo、产品名和简短价值文案。
- 微信一键登录是主操作；手机号登录/注册为次操作。
- 用户协议和隐私政策确认必须可见。
- 保持大面积留白和居中品牌秩序。

### 7.2 首页

固定顺序：天气 → AI 全天建议 → 当天行程。

- 顶部保留品牌与用户头像入口。
- 天气卡使用白色/温暖中性色，温度为最大视觉元素。
- 城市显示为只读定位状态：线性定位图标、城市名、细分隔线、小字“微信定位”；不得出现下拉箭头或手动切换。
- 天气卡右上保留来源与刷新按钮。
- AI 建议加载文案使用“综合全天行程，编排穿脱方案…”，不得暗示读取具体衣橱。
- 当天行程以紧凑列表展示时间、场景、温度和时长。

### 7.3 场景库

- 使用竖向卡片/列表展示场景名称、类别、估计温度、体感和备注。
- 自定义场景提供编辑、删除；预设场景保持稳定。
- 新建/编辑采用底部弹层，温度与体感控件遵循当前原型。
- 体感选项为：偏冷、舒适、闷热、微凉。

### 7.4 衣橱

- 顶部提供名称搜索与分类、颜色筛选。
- 衣物卡以图片为主体，编辑和删除操作保持低视觉权重。
- 上传流程展示拍摄指南、选择图片、处理中、前后对比、重新拍摄和确认入库。

### 7.5 试穿

- 试衣间与我的搭配位于同一一级入口内。
- 画板完全留白，不显示人体或固定分区。
- 衣物支持移动、缩放、层级调整和删除；选中态使用轻量边框/提示。
- 保存搭配提供名称、标签和清晰成功流转；已保存搭配可重新载入画板。

### 7.6 用户中心

- 由首页头像进入，不占用底部一级导航。
- 使用与主页面一致的中性色、卡片、开关和列表风格。
- 危险操作使用错误色和二次确认。

## 8. 交互与可用性

- 所有操作提供默认、点击/选中、加载、成功和必要的失败状态。
- 键盘焦点可见，文字对比清晰。
- 动画用于状态过渡，不作持续装饰；遵守 `prefers-reduced-motion`。
- 图像和图标不得承载唯一信息，必须有文本或可访问名称。
- 弹层保持在移动端容器内，避免横向溢出。

## 9. 禁止事项

- 禁止重新使用旧 HTML/Stitch 原型的视觉和信息结构。
- 禁止纯黑大面积背景、霓虹科技感、厚重阴影和模板化 Dashboard。
- 禁止改变四项一级导航和首页信息顺序。
- 禁止提供城市手动切换。
- 禁止把试穿画板改成固定人体分区。
- 禁止使用与功能无关的英文、编号、贴纸和过度动画。

## 10. 设计验收

- 与当前 React 原型的色彩、字体、间距、圆角和信息层级一致。
- 375–414px 宽度无横向溢出，底部导航不遮挡内容。
- 主链路操作在移动端可触达、可理解。
- 新增 UI 不因技术实现而降低视觉品质。
- 视觉修改完成后执行类型检查、构建和可用环境下的页面检查。
