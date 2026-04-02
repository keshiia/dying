# 青少年普法互动Web平台（MVP）

技术栈：React + Tailwind（前端） / Node.js + Express + Prisma + MySQL（后端）

## 1) 本地开发（Windows）

### 1.1 前置条件
- Node.js 20+（你本机已安装）
- MySQL 8.x（建议用 MySQL Installer 安装）

### 1.2 配置环境变量
在项目根目录复制并编辑：
- 复制 `.env.example` 为 `.env`
- 修改 `DATABASE_URL`、`JWT_SECRET`
- 如要启用AI助手：填写 `OPENAI_API_KEY`（不填则自动走“未配置提示”）

### 1.3 创建数据库并初始化数据
1. 在 MySQL 中创建数据库：
   - `CREATE DATABASE legal_for_teenager DEFAULT CHARACTER SET utf8mb4;`
2. 迁移与种子数据：
   - `npm run prisma:deploy`
   - `npm run prisma:seed`

### 1.4 启动开发服务器
- 安装依赖：`npm install`
- 生成 Prisma Client：`npm run prisma:generate`
- 同时启动前端+后端：`npm run dev`

前端地址：`http://localhost:5173`
后端健康检查：`http://localhost:3001/api/health`

### 1.5 种子账号
- 学生：`student@example.com` / `Student123!`
- 教师：`teacher@example.com` / `Teacher123!`

## 2) 构建与生产运行

### 2.1 构建前端
- `npm run client:build`

### 2.2 启动后端（生产）
- `npm run start`

建议生产环境由 Nginx 托管 `dist/` 并反代 `/api` 到 `3001`，详见：
- `.trae/documents/部署_青少年普法互动Web平台_从零到上线.md`
