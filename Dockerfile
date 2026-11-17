FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css app.js channels.js playlist.js pwa.js sw.js manifest.webmanifest /usr/share/nginx/html/
COPY icons/ /usr/share/nginx/html/icons/
