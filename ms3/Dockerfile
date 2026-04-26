FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY src/ ./src/
COPY migrations/ ./migrations/

# Create upload directory
RUN mkdir -p /var/uploads

# Expose port
EXPOSE 3003

# Start service
CMD ["node", "src/index.js"]
