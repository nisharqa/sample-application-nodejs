# Use official Node.js runtime as base image
# Issue: Using specific version tag, but no security scanning on base image
FROM node:22.15.0-alpine

# Issue: Running as root user in container (security issue)
# Should use: USER node or create specific user

# Set working directory
WORKDIR /app

# Issue: No health check defined
# Should have: HEALTHCHECK instruction

# Copy package files
COPY package*.json ./

# Install dependencies
# Issue: Installing in development mode by default
# Should use: npm ci --only=production for production builds
RUN npm install

# Copy application code
# Issue: Copying all files including secrets if present
# Should use .dockerignore properly
COPY . .

# Issue: Hardcoded port in image, no flexibility
EXPOSE 3000

# Issue: Running in development mode by default
# Should use: CMD ["node", "--production", "app.js"]
# or proper signal handling with node -e "process.on('SIGTERM', ...)"
CMD ["npm", "start"]

# Issues in this Dockerfile:
# - No USER directive (runs as root)
# - No HEALTHCHECK
# - No .dockerignore usage
# - Dependencies not optimized for production
# - No signal handling for graceful shutdown
# - Builds with development dependencies
# - No security scanning or vulnerability checks
# - No multi-stage build for optimization
# - No environment variable defaults
# - No explicit NODE_ENV setting
