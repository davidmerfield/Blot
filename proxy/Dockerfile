FROM openresty/openresty:alpine

# Install dependencies
RUN apk add --no-cache git bash curl openssl build-base

# Install lua-resty-auto-ssl
RUN /usr/local/openresty/luajit/bin/luarocks install lua-resty-auto-ssl

# Create required directories for lua-resty-auto-ssl
RUN mkdir -p /etc/resty-auto-ssl/storage
RUN mkdir -p /etc/resty-auto-ssl/letsencrypt/conf
RUN mkdir -p /etc/openresty/conf.d
RUN chmod 755 /etc/resty-auto-ssl

# Copy configuration files
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY ssl.conf /etc/openresty/conf.d/
COPY generate-config.js /usr/local/bin/
COPY entrypoint.sh /entrypoint.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/generate-config.js
RUN chmod +x /entrypoint.sh

# Expose ports
EXPOSE 80 443

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]