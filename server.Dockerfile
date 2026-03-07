# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Copy source code
COPY shared ./shared
COPY server ./server

# Build shared and then server
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm install --omit=dev

# Copy built assets from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma

# Env vars
ENV NODE_ENV=production

WORKDIR /app/server
EXPOSE 4000

# Start server
CMD ["npm", "start"]
