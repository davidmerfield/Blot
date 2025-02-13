if [ ! -f /etc/ssl/private/wildcard.key ] || [ ! -f /etc/ssl/certs/wildcard.crt ]; then
    mkdir -p /etc/ssl/private /etc/ssl/certs

    openssl req \
        -newkey rsa:2048 \
        -x509 \
        -nodes \
        -keyout /etc/ssl/private/wildcard.key \
        -new \
        -out /etc/ssl/certs/wildcard.crt \
        -config /etc/nginx/openssl.cnf \
        -sha256 \
        -days 3650
fi

# Start nginx
nginx -g "daemon off;"
