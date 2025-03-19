#!/bin/bash
set -e

# Generate OpenResty configuration using your JavaScript generator
node /usr/local/bin/generate-config.js

# Start OpenResty
exec /usr/local/openresty/bin/openresty -g "daemon off;"
