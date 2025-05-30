# Use the official Node.js 20 image as the base
FROM node:20-alpine

# Install build dependencies
RUN apk add --no-cache git python3 make g++

# Create app directory and set proper permissions
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./


# Install production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source files and other necessary files
COPY src/ ./src/
COPY .env* ./
COPY botconfig/ ./botconfig/

# Create directory for Google Auth credentials and set permissions
RUN mkdir -p /usr/src/app/.credentials && \
    chown -R node:node /usr/src/app

# Switch to non-root user for security
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('node:http').get('http://localhost:3000/health', (res) => { if (res.statusCode !== 200) throw new Error() })" || exit 1

# Command to run the application
CMD [ "node", "src/index.js" ]
