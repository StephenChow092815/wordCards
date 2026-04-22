# Use Node.js for building
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use Nginx for serving
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing and proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
