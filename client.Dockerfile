# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy source code
COPY shared ./shared
COPY client ./client

# Build shared and then client
RUN npm run build --workspace=shared
RUN npm run build --workspace=client

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
