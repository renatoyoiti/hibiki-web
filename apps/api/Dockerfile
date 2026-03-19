FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspace=apps/api --workspace=packages/shared

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api

RUN mkdir -p public/sounds

EXPOSE 3000

CMD ["npx", "tsx", "src/server.ts"]
