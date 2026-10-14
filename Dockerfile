FROM nginx:stable-alpine

LABEL org.opencontainers.image.source="https://github.com/BRIXTA-BESTCEMENT/bestcement"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

EXPOSE 80
