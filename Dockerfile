# Multi-stage build for Next.js application
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else npm ci --legacy-peer-deps || npm install; \
  fi

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time args for Supabase - required for SSG/prerendering
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Export as env so Next.js can read them during build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Create a minimal .env.production so build-time code reading files can find keys
RUN printf "NEXT_PUBLIC_SUPABASE_URL=%s\nNEXT_PUBLIC_SUPABASE_ANON_KEY=%s\n" "${NEXT_PUBLIC_SUPABASE_URL}" "${NEXT_PUBLIC_SUPABASE_ANON_KEY}" > .env.production || true

# Build Next.js
RUN npm run build || yarn build || pnpm build

# Production runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create .next directory if needed
RUN mkdir -p .next

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
