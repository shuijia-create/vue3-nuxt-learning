FROM node:24-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

WORKDIR /app

COPY . .

# Prisma generate needs a DATABASE_URL while building, but it does not connect to the database.
ENV DATABASE_URL="mysql://nuxt_app:password@mysql:3306/nuxt_admin_learning"

RUN npx prisma generate
RUN npm run build

FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY package.json package-lock.json ./
COPY scripts ./scripts

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
