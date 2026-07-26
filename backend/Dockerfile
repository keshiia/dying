# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# 依赖先复制（利用 Docker 缓存层）
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码（api + prisma）
COPY api ./api
COPY prisma ./prisma

# 生成 Prisma Client
RUN npx prisma generate

# ---- Runtime Stage ----
FROM node:22-alpine

WORKDIR /app

# 从 builder 复制全部
COPY --from=builder /app /app

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3001

CMD ["/start.sh"]
