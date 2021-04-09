FROM node:14-alpine as builder
# dependencies
RUN npm i -g pnpm
WORKDIR /monorepo
COPY pnpm-workspace.yaml ./
COPY apps/web-api/pnpm-lock.yaml ./pnpm-lock.yaml
COPY shared/backend-utils/package.json shared/backend-utils/
COPY apps/web-api/package.json apps/web-api/
RUN pnpm i --frozen-lockfile --prod
# build
COPY tsconfig.json ./
COPY shared/backend-utils/tsconfig.json shared/backend-utils/tsconfig.build.json shared/backend-utils/
COPY shared/backend-utils/src shared/backend-utils/src
COPY apps/web-api/tsconfig.json apps/web-api/tsconfig.build.json apps/web-api/
COPY apps/web-api/src apps/web-api/src
WORKDIR /monorepo/apps/web-api
RUN pnpm build

FROM node:14-alpine
# prod dependencies
RUN npm i -g pnpm
WORKDIR /monorepo
COPY pnpm-workspace.yaml ./
COPY apps/web-api/pnpm-lock.yaml ./pnpm-lock.yaml
COPY shared/backend-utils/package.json shared/backend-utils/
COPY apps/web-api/package.json apps/web-api/
RUN pnpm i --frozen-lockfile --prod --no-optional
# copy build
COPY --from=builder /monorepo/shared/backend-utils/dist shared/backend-utils/dist
COPY --from=builder /monorepo/apps/web-api/dist apps/web-api/dist
WORKDIR /monorepo/apps/web-api
# run
CMD ["pnpm", "start:prod"]
