# Use the official OpenResty image as the base image
FROM openresty/openresty:alpine-fat as base

ARG BLOT_HOST=blot

# Set working directory for OpenResty
WORKDIR /usr/local/openresty/nginx

# Install necessary packages
RUN apk add --no-cache openssl curl git luarocks redis nodejs npm && \
    luarocks install lua-resty-auto-ssl

# Copy custom OpenSSL configuration file into the container
COPY ./openssl.cnf /usr/local/openresty/nginx/openssl.cnf

# Generate a self-signed certificate and private key
# for the host $BLOT_HOST and all its subdomains.
RUN sed -i s/BLOT_HOST/${BLOT_HOST}/g /usr/local/openresty/nginx/openssl.cnf && \
    cat /usr/local/openresty/nginx/openssl.cnf && \
    openssl req \
    -newkey rsa:2048 \
    -x509 \
    -nodes \
    -keyout /usr/local/openresty/nginx/selfsigned.key \
    -new \
    -out /usr/local/openresty/nginx/selfsigned.crt \
    -config /usr/local/openresty/nginx/openssl.cnf \
    -sha256 \
    -days 3650

# Set working directory for the app
WORKDIR /app

# Copy the package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Set environment variables required during build
ENV NODE_SERVER_IP=node-app \
    LUA_PACKAGE_PATH=/app/.luarocks/share/lua/5.1/?.lua;/app/conf/?.lua \
    REDIS_IP=redis \
    OPENRESTY_USER=root \
    DISABLE_HTTP2=true \
    OPENRESTY_LOG_DIRECTORY=/app/data/logs \
    OPENRESTY_CACHE_DIRECTORY=/app/data/cache \
    OPENRESTY_CONFIG_DIRECTORY=/app/data \
    SSL_CERTIFICATE=/usr/local/openresty/nginx/selfsigned.crt \
    SSL_CERTIFICATE_KEY=/usr/local/openresty/nginx/selfsigned.key

# Generate OpenResty config
RUN node build-config.js

# Create required directories
RUN mkdir -p /app/data/logs /app/data/cache /app/data

# Expose port 80
EXPOSE 80

# Command to start the OpenResty server
CMD openresty -c /app/data/openresty.conf