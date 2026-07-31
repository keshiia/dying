#!/bin/sh
set -e

echo "⚙️  Running database migrations..."
npx prisma migrate deploy

# Seed 使用 upsert（幂等），重复执行不会覆盖已有数据，
# 首次启动填充测试账号、题库、资源与班级。
echo "🌱  Seeding database..."
npx prisma db seed || echo "⚠️  Seed skipped or failed (non-fatal)"

echo "🚀  Starting server..."
exec npx tsx api/server.ts
