FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspace=apps/web --workspace=packages/shared

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
