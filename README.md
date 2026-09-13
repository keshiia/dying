# 青知法苑 · 青少年普法智能体

> 让法治成为青春的底色 —— 面向中学生的游戏化 + 智能体个性化普法平台

---

## 一、作品简介

### 1.1 项目背景

随着互联网在青少年群体中的普及，校园欺凌、网络诈骗、个人信息泄露、消费维权、交通安全、毒品诱导等法律问题日益突出。然而，传统的普法教育多停留在法律条文的宣讲层面，形式单一、内容枯燥，学生难以产生学习兴趣，学习效果无法量化评估，教师的"教"与学生的"学"都缺乏有效的工具支撑。

本项目"青知法苑"面向中学生与法治教师，构建一个**游戏化学习 + 智能体个性化**的普法平台：以模拟法庭、案件侦查、闯关挑战、普法漫画等互动形式降低学习门槛；并内置一套轻量智能体系统，通过持续分析学生的学习行为数据，生成**个性化画像、智能推荐、错题复盘与每周目标**，让法治教育从"千人一面"走向"千人千面"。

### 1.2 核心功能

平台设有**学生端**和**教师端**两个角色。

#### 学生端

| 功能模块 | 说明 |
|---------|------|
| **漫画学法** | 基于真实案例改编的普法漫画，沉浸式阅读，完成获得经验值 |
| **模拟法庭** | 完整模拟"收案—现场搜证—法庭调查—法庭辩论—合议裁决—宣判"判案流程 |
| **案件侦查** | 场景探索、线索搜集、NPC 询问、推理还原真相，训练证据思维 |
| **学习闯关** | 6 大法律主题、60 个关卡、303 道情境化题目，按顺序解锁，答对获得经验值 |
| **智能体个性化** | 六维学习画像、智能推荐、错题复盘、每周学习目标（详见 1.5） |
| **AI 咨询助手** | 基于 OpenAI 兼容接口的对话式咨询助手，带用户记忆，提供个性化法律学习建议 |
| **案例中心** | 案例、法条摘要、视频、文章等 64 条普法资源，支持分类检索 |
| **任务中心** | 查看并完成教师布置的闯关与阅读任务 |
| **成长中心** | 等级、经验值、9 枚成就徽章、连续学习天数、每周学习趋势仪表盘 |

#### 教师端

| 功能模块 | 说明 |
|---------|------|
| **进度看板** | 班级整体数据：学生人数、近 7 日活跃人数、挑战总次数、平均得分 |
| **班级管理** | 创建班级、生成邀请码、查看班级成员及个人学习数据 |
| **任务布置** | 向班级布置关卡挑战或资源阅读任务，设置截止日期 |
| **资源发布** | 教师可发布法律案例、法条摘要、视频、文章等普法资源 |

### 1.3 学习内容覆盖

平台涵盖青少年日常生活中最常见的 6 大法律主题：

1. **校园安全** —— 校园欺凌的识别与应对、受教育权保护
2. **网络安全** —— 网络诈骗防范、个人信息保护、网络言论边界
3. **家庭权益** —— 未成年人家庭保护、家庭暴力的识别
4. **消费维权** —— 网购维权、消费者权利、预付卡退款
5. **交通安全** —— 交通法规、骑行安全、事故处理
6. **禁毒教育** —— 毒品危害认知、识别与拒绝技巧

每个主题下设 10 个关卡（共 60 关），题目类型包括：

- **单选题（SINGLE）**：标准四选一
- **判断题（TRUE_FALSE）**：判断对错
- **情境题（SCENARIO）**：基于真实场景的案例分析

所有题目均配有详细解析与法条出处，答错后可查看正确答案与法律依据。

### 1.4 游戏化设计

- **经验值系统（XP）**：闯关得分 ≥ 60 获得对应 XP，阅读漫画获得 XP，通关模拟法庭/案件侦查按表现发放 XP
- **等级系统**：每 100 XP 升一级，等级对应称号（法律小白 → 初级法律达人 → 法律知识进阶 → 法律小专家 → 法律小达人）
- **成就徽章**：9 枚可解锁徽章，涵盖学习起步、连续打卡、高分挑战、关卡通关等维度，解锁有庆祝动画
- **顺序解锁**：主题内关卡按顺序解锁，保证知识体系完整
- **错题复习**：得分低于 100 分的关卡进入"待复习"列表，鼓励巩固薄弱环节

### 1.5 智能体个性化（本项目核心特色）

在常规学习功能之上，平台内置了一套轻量智能体系统，围绕学生数据提供四项个性化能力：

| 能力 | 说明 |
|------|------|
| **六维学习画像** | 按 6 大主题统计掌握度，识别薄弱点、优势项与学习风格，以雷达图直观呈现 |
| **智能推荐** | 根据画像推荐"下一步学什么"并给出理由（如"你的网络安全掌握度较低，建议优先学习"） |
| **智能错题复盘** | 聚合错题，识别共性错误模式（如"情境分析题正确率低"），生成针对性改进建议 |
| **每周学习目标** | 基于学习节奏自动拆解本周目标（完成关卡 / 错题复盘 / 每日打卡）并跟踪进度 |

同时，AI 咨询助手在每次对话时自动注入用户画像、学习进度与历史提问，实现**带记忆的个性化问答**。

---

## 二、开源代码与组件使用情况说明

### 2.1 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | React | 18.3 | 用户界面构建 |
| 前端路由 | React Router DOM | 7.3 | 客户端路由管理 |
| 状态管理 | Zustand | 5.0 | 全局状态（用户认证信息） |
| CSS 框架 | Tailwind CSS | 3.4 | 原子化样式系统 |
| UI 图标 | Lucide React | 0.511 | 矢量图标库 |
| Markdown 渲染 | react-markdown | 10.1 | 资源详情页的富文本渲染 |
| 构建工具 | Vite | 6.3 | 前端打包与开发服务器 |
| 后端框架 | Express.js | 4.21 | RESTful API 服务 |
| 数据库 ORM | Prisma | 6.6 | 类型安全的数据库操作 |
| 数据库 | MySQL | 8.x | 关系型数据存储 |
| 身份认证 | jsonwebtoken | 9.0 | JWT Token 签发与验证 |
| 密码加密 | bcryptjs | 3.0 | 用户密码哈希加密 |
| 参数校验 | Zod | 3.24 | 请求参数类型校验 |
| TypeScript | TypeScript | 5.8 | 全栈类型安全 |
| AI 接口 | OpenAI 兼容接口 | — | AI 咨询助手（可配置任意兼容模型） |
| 容器编排 | Docker Compose | — | 前端 / 后端 / 数据库一键部署 |

### 2.2 开源协议

本项目使用的所有开源组件均遵循其各自的许可证：

| 组件 | 许可证 | 类型 |
|------|--------|------|
| React | MIT | 宽松许可 |
| Express.js | MIT | 宽松许可 |
| Prisma | Apache-2.0 | 宽松许可 |
| MySQL | GPL-2.0 / Commercial | 双许可 |
| Tailwind CSS | MIT | 宽松许可 |
| Zustand | MIT | 宽松许可 |
| Lucide React | ISC | 宽松许可 |
| jsonwebtoken | MIT | 宽松许可 |
| bcryptjs | MIT | 宽松许可 |
| Zod | MIT | 宽松许可 |
| Vite | MIT | 宽松许可 |

### 2.3 自研组件清单

| 组件 | 文件 | 说明 |
|------|------|------|
| AppShell | `src/components/AppShell.tsx` | 应用主布局外壳，含侧边栏导航、移动端适配、用户信息 |
| ProfileRadar | `src/components/student/ProfileRadar.tsx` | 六维学习画像雷达图（纯 SVG 实现） |
| GoalCard | `src/components/student/GoalCard.tsx` | 每周学习目标卡片 |
| RecommendationSection | `src/components/student/RecommendationSection.tsx` | 智能推荐列表组件 |
| ErrorAnalysisPanel | `src/components/student/ErrorAnalysisPanel.tsx` | 智能错题复盘面板 |
| ChallengeModal | `src/components/student/ChallengeModal.tsx` | 闯关答题模态框，支持单选/判断/情境三种题型 |
| BannerCarousel | `src/components/ui/BannerCarousel.tsx` | 轮播图组件 |
| Button / Card / Input | `src/components/ui/` | 通用 UI 组件库 |
| Modal / Sheet / Tag / Toast | `src/components/ui/` | 通用模态框、抽屉、标签、轻提示 |
| ProgressBar | `src/components/ui/ProgressBar.tsx` | 进度条组件 |

后端自研模块：

| 模块 | 文件 | 说明 |
|------|------|------|
| 学生画像引擎 | `backend/api/lib/studentProfile.ts` | 主题掌握度 / 薄弱点 / 学习风格分析 |
| 推荐规则引擎 | `backend/api/lib/recommendationEngine.ts` | 基于画像的个性化推荐生成 |

### 2.4 项目结构

```
legal-for-teen/
├── frontend/                    # 独立前端（React SPA）
│   ├── src/
│   │   ├── pages/               # 页面（Login, Assistant, student/, teacher/）
│   │   ├── components/          # UI 组件与业务组件
│   │   ├── stores/auth.ts       # Zustand 认证状态
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── utils/api.ts         # API 请求封装
│   │   ├── data/                # 静态法律知识、案件数据
│   │   ├── types.ts             # TypeScript 类型定义
│   │   ├── App.tsx              # 路由配置与认证守卫
│   │   └── main.tsx             # React 入口
│   ├── public/images/           # 静态图片资源（漫画、轮播图）
│   ├── index.html               # SPA 入口 HTML
│   ├── vite.config.ts           # Vite 构建配置
│   ├── tailwind.config.js       # Tailwind CSS 配置
│   ├── nginx.conf               # Nginx 部署配置
│   └── Dockerfile               # 前端 Docker 镜像
├── backend/                     # 独立后端（Express API）
│   ├── api/
│   │   ├── app.ts               # Express 应用入口与路由挂载
│   │   ├── server.ts            # 本地开发服务器
│   │   ├── lib/                 # 工具库（env, jwt, prisma, studentProfile, recommendationEngine）
│   │   ├── middleware/          # 认证中间件（requireAuth, requireRole）
│   │   └── routes/              # API 路由（auth, student, teacher, resources, ai）
│   ├── prisma/
│   │   ├── schema.prisma        # 数据库模型定义（15 个模型）
│   │   ├── seed.ts              # 幂等种子数据
│   │   └── migrations/          # 数据库迁移文件
│   ├── Dockerfile               # 后端 Docker 镜像
│   └── start.sh                 # 容器启动脚本（自动迁移 + 自动 seed）
├── docker-compose.yml           # Docker 编排（MySQL + 后端 + 前端）
├── .env                         # 环境变量
└── README.md
```

---

## 三、安装与部署说明

### 3.1 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Docker & Docker Compose | 最新版（推荐） |
| 或 Node.js | 20.x 及以上（本地开发） |
| 或 MySQL | 8.x |

### 3.2 Docker 部署（推荐）

**第一步：准备项目文件**

将项目源码（或已构建的 Docker 镜像 tar 包）放到服务器 `/opt/legal-for-teen/`。

**第二步：配置环境变量**

创建 `.env` 文件：

```env
# MySQL
MYSQL_ROOT_PASSWORD=root123
MYSQL_DATABASE=lft_db
MYSQL_USER=lft_user
MYSQL_PASSWORD=lft_pass123

# JWT（生产环境务必更换为随机长字符串）
JWT_SECRET=替换为一个随机字符串
JWT_EXPIRES_IN=7d

# CORS（改为你的服务器 IP 或域名）
FRONTEND_ORIGIN=http://你的服务器IP

# AI 咨询助手（可选，不配置则使用默认回复）
OPENAI_API_KEY=你的API密钥
OPENAI_MODEL=mimo-v2.5
OPENAI_BASE_URL=https://api.xiaomimimo.com
```

**第三步：启动服务**

```bash
docker compose up -d
```

首次启动会自动：
1. 构建前端、后端镜像（或直接使用已加载的镜像）；
2. 后端自动执行 `prisma migrate deploy` 建表；
3. 后端自动执行 `prisma db seed`（幂等，可重复执行）填充题库与测试账号；
4. 启动 Nginx 前端，反向代理 `/api` 到后端。

**第四步：访问**

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost 或 http://你的服务器IP |
| 后端健康检查 | http://你的服务器IP/api/health（经前端 nginx 反代；本地开发也可直接访问 http://localhost:3001/api/health） |

**种子账号：**

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 学生 | student@example.com | Student123! |
| 教师 | teacher@example.com | Teacher123! |

**常用 Docker 命令：**

```bash
docker compose ps              # 查看服务状态
docker compose logs -f backend # 查看后端日志
docker compose restart         # 重启所有服务
docker compose down            # 停止服务（保留数据）
docker compose down -v         # ⚠️ 停止并删除数据（慎用）
```

> **部署提示**：db 与 backend 容器默认不对外暴露端口（仅内部网络访问），更安全；只有前端 80 端口对外开放。

### 3.3 本地开发安装（无 Docker）

**第一步：安装依赖**

```bash
cd frontend && npm install
cd ../backend && npm install
```

**第二步：配置后端环境变量**

创建 `backend/.env`：

```env
DATABASE_URL="mysql://lft_user:lft_pass123@localhost:3306/lft_db"
JWT_SECRET="一个随机的长字符串"
FRONTEND_ORIGIN="http://localhost:5173"
```

**第三步：初始化数据库**

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

**第四步：启动开发服务器**

```bash
# 终端 1：后端（端口 3001）
cd backend && npm run dev

# 终端 2：前端（端口 5173，Vite 自动代理 /api）
cd frontend && npm run dev
```

---

## 四、设计思路

### 4.1 整体架构

项目采用**前后端分离架构**，通过 Docker 容器化部署：

- **前端**：React 单页应用（SPA），Vite 构建，Tailwind CSS 响应式设计；生产环境由 Nginx 提供静态文件服务与 SPA fallback
- **后端**：Express.js RESTful API，Prisma ORM 操作 MySQL，含认证、业务与智能体分析路由
- **数据库**：MySQL 8.x，独立容器运行
- **部署**：Docker Compose 编排三个容器，Nginx 反向代理 `/api` 请求到后端，实现同源访问

```
                           ┌─────────────────┐
                           │   浏览器访问     │
                           │  http://localhost │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │   frontend       │
                           │   (Nginx:80)     │
                           │  / → index.html  │
                           │  /api/* → proxy  │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │   backend        │
                           │  (Express:3001)  │
                           │   RESTful API    │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │   MySQL 8.x      │
                           │   (db:3306)      │
                           └─────────────────┘
```

### 4.2 智能体个性化架构

智能体功能由后端模块在容器内离线计算，不依赖外部大模型服务：

```
学生行为数据（答题 / 进度 / 漫画 / 游戏）
        │
        ▼
学生画像引擎（studentProfile.ts）
   · 6 主题掌握度 + 趋势识别
   · 按题型聚合薄弱点
   · 学习风格识别（活跃时段 / 节奏 / 偏好题型）
   · 惰性更新（5 分钟缓存）
        │
        ├──► 六维雷达图（前端 ProfileRadar）
        ├──► 推荐规则引擎 → 智能推荐区
        ├──► 错题聚合分析 → 错题复盘面板
        └──► 每周目标生成 → 目标卡片
AI 对话接口每次请求动态注入画像 / 进度 / 历史提问 → 个性化问答
```

### 4.3 用户角色与权限设计

- 通过 JWT Token 认证，`requireAuth` 中间件校验登录态，`requireRole` 中间件校验角色权限
- 前端路由同样配置认证守卫，未登录自动跳转登录页，学生 / 教师路由互相隔离
- 学生通过邀请码加入班级，教师无法直接拉人

### 4.4 游戏化学习模型

- **经验值与等级**：闯关得分 ≥ 60 获得 XP，每 100 XP 升级，等级对应法律称号
- **顺序解锁**：主题内关卡按顺序完成，避免跳学，保证知识体系完整
- **成就徽章**：9 枚徽章覆盖起步、打卡、高分、通关等维度，解锁有庆祝动画
- **错题复习**：低分关卡进入待复习列表，鼓励巩固

### 4.5 内容设计思路

- **主题选择依据**：基于《中华人民共和国未成年人保护法》《预防未成年人犯罪法》等法律法规，结合青少年最常遇到的法律场景筛选
- **题目设计原则**：真实案例改编、语言适合中学生、情境题训练应用能力、每题附解析与法条出处
- **漫画内容**：校园欺凌、网络诈骗、消费者权益三个高频场景，读后展示"法律小课堂"
- **安全边界**：高风险场景（自伤、暴力、性侵、勒索）自动提示求助渠道（监护人 / 老师 / 110 / 12348）

### 4.6 AI 咨询助手设计

- 基于 OpenAI 兼容接口（可切换 DeepSeek、小米 MiMo 等任意兼容模型），后端转发
- **带记忆**：每次对话注入用户画像、完成关卡摘要与历史提问
- **安全提示词**：不提供具体法律意见，只做学习解释；高风险内容优先引导求助
- **未成年人适配**：语言温和、行动导向（3-5 条清单）
- 未配置 API Key 时自动降级为内置学习建议，不阻塞功能

---

## 五、设计重点与难点

### 5.1 游戏化闯关系统的状态管理

- 后端通过 `UserProgress` 记录每名学生每关的最佳成绩与状态
- 顺序解锁逻辑在后端实现，前端根据 `progress` 字段渲染
- 答题在前端模态框内完成，提交时一次性校验，返回逐题解析

### 5.2 智能体画像的数据聚合与分析

- 画像引擎读取全部答题记录，按主题 / 题型聚合掌握度，近三个月与更早数据对比识别趋势
- 采用惰性更新（5 分钟缓存），控制计算开销，避免每次请求全量重算
- 结果持久化到 `StudentProfile` 表，前端雷达图纯 SVG 渲染，零第三方依赖

### 5.3 推荐与目标的规则引擎

- 推荐引擎综合画像薄弱主题、重复失败关卡、学习节奏、漫画阅读状态，生成带理由的推荐
- 目标引擎按周拆解并写入 `StudentGoal` 表，重复生成会先清理当周旧目标，保证唯一
- 全部离线计算，即使 AI Key 未配置，核心个性化能力依然完整可用

### 5.4 AI 助手的安全性设计

- 系统提示词明确约束：不提供具体法律意见、高风险优先求助、语言适合未成年人、给出行清单
- 对话记录持久化到 `AiChatMessage`，用于个性化上下文（仅取最近 5 条），避免越权信息泄露

### 5.5 前后端认证与权限体系

- JWT + `requireAuth` + `requireRole` 双层校验
- 前端路由守卫 + 后端接口校验双重保障，防止越权访问

### 5.6 数据初始化与容器编排

- `start.sh` 容器启动时自动执行迁移与幂等 seed（`upsert`），首次启动即填充 60 关题库与测试账号，重复启动不产生重复数据
- 端口发布策略按用途区分，仓库内有两份 compose：
  - 根目录 `docker-compose.yml` 用于**本地开发**：db(3306) 与 backend(3001) 发布到宿主机，以便在宿主机运行 `npm run dev`（vite 的 `/api` 代理指向 `localhost:3001`）以及 prisma 命令直连数据库
  - `deploy/docker-compose.yml` 用于**部署**：仅前端 80 对外，db 与 backend 不发布端口，只在容器网络内可达（后端走 `db:3306`，前端 nginx 走 `backend:3001`），兼顾安全与端口冲突规避

---

## 六、创新描述

### 6.1 智能体个性化普法（核心创新）

传统普法教育"千人一面"，本项目通过内置的轻量智能体系统，让平台**认识每一个学生**：六维学习画像、智能推荐、错题复盘、每周目标、带记忆的 AI 对话，五重个性化能力将法治教育从"统一授课"升级为"因材施教"。

### 6.2 游戏化普法教育模式

将法律学习融入模拟法庭、案件侦查、闯关挑战、普法漫画等互动形式，通过经验值、等级、徽章、顺序解锁等机制，把枯燥法条转化为可玩、可感、可坚持的挑战任务。

### 6.3 情境化题目设计

大量采用情境题（SCENARIO），模拟真实生活场景（如"同学在群里发布你的照片并配侮辱性文字"），考察的不只是法条记忆，更是真实场景中运用法律自护的能力。

### 6.4 带记忆的 AI 咨询助手

AI 助手不再是无状态问答，而是能结合学生年级、进度与历史提问给出上下文相关的回答；未配置 Key 时优雅降级，保证可用性。

### 6.5 双角色协同教学设计

学生自主探索 + 教师精准引导的教学闭环：教师建班、布任务、看数据；学生闯关、游戏、问 AI，形成完整的"学习—练习—评估—干预"链路。

### 6.6 纯前端数据可视化

六维雷达图、7 日趋势图等全部手写 SVG，零第三方图表库依赖，包体更小、加载更快。

### 6.7 全栈 TypeScript 类型安全

前后端全面 TypeScript + Prisma 类型安全 ORM，接口类型一致、查询结果明确、重构可控，在项目规模下体现工程化严谨度。

---

## 七、API 接口文档

### 7.1 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |

### 7.2 学生接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/student/units` | 获取所有学习单元及进度 |
| GET | `/api/student/levels/:id/questions` | 获取关卡题目（自适应排序） |
| POST | `/api/student/levels/:id/submit` | 提交关卡答案 |
| GET | `/api/student/summary` | 获取学习统计摘要 |
| GET | `/api/student/review-levels` | 获取待复习关卡 |
| GET | `/api/student/profile` | 获取六维学习画像 |
| GET | `/api/student/recommendations` | 获取个性化推荐 |
| GET | `/api/student/error-analysis` | 获取智能错题分析 |
| GET | `/api/student/goals` | 获取本周学习目标 |
| POST | `/api/student/goals/generate` | 生成 / 刷新本周目标 |
| POST | `/api/student/comic-read` | 记录漫画阅读 |
| GET | `/api/student/comic-reads` | 获取已读漫画列表 |
| POST | `/api/student/court-result` | 提交模拟法庭成绩 |
| POST | `/api/student/detective-result` | 提交案件侦查成绩 |
| POST | `/api/student/join-class` | 通过邀请码加入班级 |
| GET | `/api/student/tasks` | 获取任务列表 |
| POST | `/api/student/tasks/:id/submit` | 提交任务 |

### 7.3 教师接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/teacher/classes` | 获取班级列表 |
| POST | `/api/teacher/classes` | 创建班级 |
| GET | `/api/teacher/classes/:id/members` | 获取班级成员 |
| GET | `/api/teacher/dashboard` | 获取班级看板数据 |
| POST | `/api/teacher/assignments` | 布置任务 |
| GET | `/api/teacher/assignments` | 获取任务列表 |
| POST | `/api/teacher/resources` | 发布资源 |

### 7.4 公共接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/resources` | 搜索 / 浏览资源 |
| GET | `/api/resources/:id` | 获取资源详情 |
| POST | `/api/ai/chat` | AI 助手对话 |
| GET | `/api/health` | 健康检查 |

---

## 八、数据库设计

系统共包含 15 个数据模型：

| 模型 | 说明 | 关键字段 |
|------|------|---------|
| User | 用户 | email, role, xp, level, grade |
| Class | 班级 | name, joinCode, teacherId |
| ClassMember | 班级成员 | classId, studentId |
| LearningUnit | 学习单元 | title, category, gradeRange, orderNo |
| Level | 关卡 | unitId, title, xpReward, orderNo |
| Question | 题目 | levelId, type, prompt, answerKey, explanation, difficulty |
| Attempt | 答题记录 | studentId, levelId, score, correctCount |
| UserProgress | 学习进度 | studentId, levelId, bestScore, status |
| Resource | 普法资源 | title, type, tagsJson, contentMd |
| Assignment | 任务 | classId, targetType, targetId, dueAt |
| AssignmentSubmission | 任务提交 | assignmentId, studentId |
| ComicRead | 漫画阅读记录 | studentId, storyId |
| StudentProfile | 学生画像 | topicMasteries, weakAreas, strengths, learningStyle |
| AiChatMessage | AI 对话记录 | studentId, role, content, sessionId |
| StudentGoal | 每周学习目标 | targetType, targetCount, progress, completed |
