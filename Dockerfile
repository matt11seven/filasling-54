
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install necessary packages for our scripts
RUN apk add --no-cache bash postgresql-client gettext curl

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom error page
COPY usr/share/nginx/html/custom_50x.html /usr/share/nginx/html/custom_50x.html

# Add nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy deployment scripts
COPY ./env.sh /usr/local/bin/env.sh
RUN chmod +x /usr/local/bin/env.sh

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

# Run the script to replace environment variables and start nginx
CMD ["/bin/sh", "-c", "set -e; /usr/local/bin/env.sh && nginx -g 'daemon off;'"]
