FROM node:24-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend /app/frontend/build ./public
CMD ["node", "server.js"]