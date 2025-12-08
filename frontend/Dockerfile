# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
# Copy custom nginx configuration to a safe path for custom envsubst
COPY nginx.conf /etc/nginx/nginx.conf.template

# Configure Nginx to run as non-root
# Nginx Alpine uses 'nginx' user by default
# We need to change ownership of directories Nginx writes to
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html \
    # Remove 'user' directive from default nginx.conf to avoid warning when running as non-root
    && sed -i '/user  nginx;/d' /etc/nginx/nginx.conf

# Switch to non-root user
USER nginx

# Expose port 8080 (must match listen port in nginx.conf)
EXPOSE 8080

# Extract the nameserver from /etc/resolv.conf and substitute it into the nginx config
CMD ["/bin/sh", "-c", "export RESOLVER=$(awk 'BEGIN{ORS=\"\"} /^nameserver/{print $2; exit}' /etc/resolv.conf) && envsubst '${BACKEND_HOST} ${BACKEND_PORT} ${BACKEND_PROTOCOL} ${RESOLVER} ${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
