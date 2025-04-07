
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

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Create a startup script that will replace the environment variables at runtime
RUN apk add --no-cache bash postgresql-client
COPY ./env.sh /usr/local/bin/env.sh
RUN chmod +x /usr/local/bin/env.sh

EXPOSE 80

# Run the script to replace environment variables and start nginx
CMD ["/bin/sh", "-c", "/usr/local/bin/env.sh && nginx -g 'daemon off;'"]
