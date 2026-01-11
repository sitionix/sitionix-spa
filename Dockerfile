FROM node:22.12-alpine AS build

WORKDIR /app

RUN npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

ARG VITE_API_BASE_URL=http://localhost:8080/bffssox
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm -r build

EXPOSE 3000 3001 3002

CMD ["pnpm","-r","--parallel","--filter","@apps/shell","--filter","@apps/auth","--filter","@apps/workspace","preview","--","--host","0.0.0.0"]
