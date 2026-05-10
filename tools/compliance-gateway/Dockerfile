FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --production

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 gtcx && adduser -u 1001 -G gtcx -s /bin/sh -D gtcx
COPY --from=deps --chown=gtcx:gtcx /app/node_modules ./node_modules
COPY --chown=gtcx:gtcx src/ ./src/
COPY --chown=gtcx:gtcx jurisdictions.json ./compliance-data/jurisdictions.json
USER gtcx
EXPOSE 8500
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:8500/health || exit 1
CMD ["node", "src/server.mjs"]
