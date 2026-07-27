#!/bin/sh
node /app/api.js &
exec nginx -g 'daemon off;'
