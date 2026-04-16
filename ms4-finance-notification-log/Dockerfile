FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Expose port
EXPOSE 3004

# Start the service
CMD ["npm", "start"]
