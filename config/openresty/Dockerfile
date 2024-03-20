# Use the nginx:alpine image as the base image
FROM nginx:alpine

ARG BLOT_HOST=blot

# Set working directory
WORKDIR /etc/nginx

# Install openssl
RUN apk add --no-cache openssl

# Copy a custom OpenSSL configuration file into the container
COPY ./openssl.cnf /etc/nginx/openssl.cnf

# Generate a self-signed certificate and private key
# for the host $BLOT_HOST and all its subdomains.
RUN sed -i s/BLOT_HOST/${BLOT_HOST}/g /etc/nginx/openssl.cnf \
    && cat /etc/nginx/openssl.cnf \
    && openssl req \
    -newkey rsa:2048 \
    -x509 \
    -nodes \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -new \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -config /etc/nginx/openssl.cnf \
    -sha256 \
    -days 3650

# Copy the custom Nginx configuration file into the container
COPY ./development_server.conf /etc/nginx/nginx.conf