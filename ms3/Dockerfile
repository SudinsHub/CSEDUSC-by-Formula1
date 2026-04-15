FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create upload directory
RUN mkdir -p /var/uploads

# Expose port
EXPOSE 3003

# Start service
CMD ["node", "src/index.js"]
