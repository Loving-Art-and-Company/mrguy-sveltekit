FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV PUBLIC_POSTHOG_KEY=""
ENV PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
ENV PUBLIC_POSTHOG_SESSION_RECORDING="false"
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
EXPOSE 8080
CMD ["node", "build"]
