# Stage 1 — build the static site (Node built-ins only, no npm install)
FROM node:22-alpine AS build
WORKDIR /site
COPY . .
RUN node build.js

# Stage 2 — serve it
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/public /usr/share/nginx/html
EXPOSE 80
