FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends libvips42 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY client/package.json client/bun.lock ./client/
COPY server/package.json server/bun.lock ./server/
RUN bun install --frozen-lockfile

FROM deps AS client-build
COPY client ./client
ENV NODE_ENV=production
RUN bun run --cwd client build

FROM deps AS release
COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist

WORKDIR /app/server
ENV PORT=8080
ENV STATIC_DIR=/app/client/dist
ENV DATA_DIR=/app/server/data

EXPOSE 8080
CMD ["bun", "run", "start"]
