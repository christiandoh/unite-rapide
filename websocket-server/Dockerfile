FROM docker.io/node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --spider http://localhost:8080/health || exit 1
USER node
CMD ["node", "src/server.js"]
