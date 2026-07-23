FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY apps/api ./apps/api

RUN npm exec --workspace=api -- prisma generate
RUN npm run build --workspace=api
RUN npm prune --omit=dev


FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist

USER node

EXPOSE 3001

CMD ["npm", "run", "start:prod", "--workspace=api"]
