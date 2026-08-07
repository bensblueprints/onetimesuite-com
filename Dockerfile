# Stage 1 — build the static site (Node built-ins only, no npm install)
FROM node:22.14-alpine AS build
# Meta Pixel id — set as a build-time env in Coolify; empty = pixel omitted
ARG META_PIXEL_ID=
ENV META_PIXEL_ID=$META_PIXEL_ID
WORKDIR /site
COPY . .
RUN node build.js

# Stage 2 — serve the static site AND run the lead-capture/admin API in one
# container. Final base is node:22-alpine (the API needs Node); nginx is added
# via apk. Alpine's nginx package reads /etc/nginx/http.d/*.conf (NOT the
# Debian-style conf.d used by the official nginx image) and ships a default
# server at /etc/nginx/http.d/default.conf — remove it before copying ours.
FROM node:22.14-alpine
RUN apk add --no-cache nginx && mkdir -p /run/nginx && rm -f /etc/nginx/http.d/default.conf
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build /site/public /usr/share/nginx/html
# Every server module, not just api.js — a missed file here is a boot-time
# MODULE_NOT_FOUND that used to leave nginx serving a dead API.
COPY server/*.js /app/
# Coupon-eligible catalog, emitted by build.js in stage 1.
COPY --from=build /site/public/_data/catalog.json /app/catalog.json
COPY NEXT-UP.md /app/NEXT-UP.md
COPY start.sh /app/start.sh
EXPOSE 80
CMD ["sh", "/app/start.sh"]
