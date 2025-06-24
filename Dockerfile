# --- Builder Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build all projects (will no-op if none yet)
RUN npx nx run-many -t build --all --skip-nx-cache

# --- Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy runtime package files & install only prod deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built artifacts
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD [ "node", "dist/index.js" ] 