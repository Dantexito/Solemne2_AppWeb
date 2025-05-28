# Stage 1: Build the Vue.js application
FROM node:24-alpine AS build-stage

# Install pnpm globally in this stage
RUN npm install -g pnpm

WORKDIR /app

# Copy package.json AND pnpm-lock.yaml
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies using pnpm.
# Using --frozen-lockfile is recommended for CI/Docker to ensure exact dependencies.
RUN pnpm install --frozen-lockfile

# Copy the rest of your application source code
# This is done AFTER pnpm install and node_modules is in .dockerignore
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine AS production-stage

# Update Alpine packages to the latest versions
RUN apk update && \
    apk upgrade --available && \
    rm -rf /var/cache/apk/*

COPY --from=build-stage /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf # If you have custom Nginx config
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]