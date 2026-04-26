FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Expose port
EXPOSE 3004

# Start the service
CMD ["npm", "start"]
