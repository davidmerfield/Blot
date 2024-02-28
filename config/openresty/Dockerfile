# Filename: config/openresty/Dockerfile

# Use the nginx:alpine image as the base image
FROM nginx:alpine

# Set working directory
WORKDIR /etc/nginx

# Generate a self-signed certificate and private key
RUN apk add --no-cache openssl \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
       -keyout /etc/ssl/private/nginx-selfsigned.key \
       -out /etc/ssl/certs/nginx-selfsigned.crt \
       -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=*.docker.local"

# Copy the custom Nginx configuration file into the container
COPY ./development_server.conf /etc/nginx/nginx.conf