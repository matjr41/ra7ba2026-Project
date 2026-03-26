# ========================
# 1) Build stage
# ========================
FROM node:20-alpine AS builder

# أدوات لازمة لتشغيل Prisma engine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# رفع حد الذاكرة أثناء البناء (مفيد على بيئات RAM منخفضة)
ENV NODE_OPTIONS=--max-old-space-size=512

# تثبيت التبعيات
COPY package*.json ./
# نحتاج لملفات Prisma أثناء postinstall
COPY prisma ./prisma
COPY scripts ./scripts
RUN npm install --legacy-peer-deps

# نسخ كود المصدر وملفات Prisma
COPY . ./
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate

# بناء NestJS
RUN npm run build

# حذف تبعيات التطوير والإبقاء على تبعيات الإنتاج فقط
RUN npm prune --omit=dev


# ========================
# 2) Runtime stage
# ========================
FROM node:20-alpine

# أدوات لازمة + curl للـ Health-check
RUN apk add --no-cache openssl libc6-compat curl

WORKDIR /app

ENV NODE_ENV=production
# رفع حد الذاكرة في التشغيل أيضاً
ENV NODE_OPTIONS=--max-old-space-size=512
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# نسخ تبعيات الإنتاج والـ dist وملفات prisma من مرحلة البناء
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/create-admin.js ./create-admin.js
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

# تثبيت Prisma CLI في وقت التشغيل لتطبيق الـ migrations تلقائياً
RUN npm install --no-save prisma

## المنفذ على Render عادة 10000
EXPOSE 10000

## Health-check على /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

# شغّل التطبيق عبر entrypoint (يفتح البورت فوراً ويشغّل الميغريشن بالخلفية)
ENV ADMIN_BOOTSTRAP_ON_START=true
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
