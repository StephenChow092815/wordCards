FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Data directory for SQLite
RUN mkdir -p /app/data
ENV DATABASE_URL=/app/data/database.sqlite
EXPOSE 5001
CMD ["node", "index.js"]
