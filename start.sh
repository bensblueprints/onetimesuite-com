#!/bin/sh
# If the API dies, take the whole container down (kill 1) so Coolify's
# healthcheck actually fails. Previously nginx kept serving a dead API and the
# container reported healthy while every /api/ call 502'd.
node /app/api.js || kill 1 &
exec nginx -g 'daemon off;'
