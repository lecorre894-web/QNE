FROM node:22-alpine
WORKDIR /opt/QNE
COPY qne_v12/ ./qne_v12/
COPY qne_v13/ ./qne_v13/
RUN addgroup -S qne && adduser -S qne -G qne && mkdir -p /var/lib/qne && chown -R qne:qne /var/lib/qne
USER qne
CMD ["node","qne_v13/worker.js"]
