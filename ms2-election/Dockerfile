FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY src ./src
COPY migrations ./migrations

EXPOSE 3002

CMD ["node", "src/index.js"]
