# Use the nginx:alpine image as the base image
FROM nginx:alpine

ARG BLOT_HOST=localhost

# Set working directory
WORKDIR /etc/nginx

# Install openssl
RUN apk add --no-cache openssl

# Copy a custom OpenSSL configuration file into the container
COPY ./openssl.cnf /etc/nginx/openssl.cnf

# Copy the custom Nginx configuration file into the container
COPY ./development_server.conf /etc/nginx/nginx.conf

# Copy init script
COPY ./init.sh /etc/nginx/init.sh