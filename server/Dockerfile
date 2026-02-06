# ================================
# Production Dockerfile for Server
# Optimized for Railway deployment
# ================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage
FROM node:20-alpine AS production

# Set environment
ENV NODE_ENV=production
ENV PORT=8000

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package*.json ./
COPY src ./src

# Create data directory for SQLite with proper permissions
RUN mkdir -p data && chown -R nodejs:nodejs data

# Switch to non-root user
USER nodejs

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Expose port (Railway uses PORT env variable)
EXPOSE ${PORT}

# Start the application
CMD ["node", "src/index.js"]
