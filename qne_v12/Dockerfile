FROM node:22-alpine
WORKDIR /opt/QNE
COPY . /opt/QNE/qne_v12/
RUN addgroup -S qne && adduser -S qne -G qne && mkdir -p /var/lib/qne && chown -R qne:qne /var/lib/qne /opt/QNE
USER qne
CMD ["node", "qne_v12/worker.js"]
