# setting default node version of docker image
ARG NODE_VERSION=lts-alpine

# using node image as base image
FROM node:${NODE_VERSION} as dev

# setting pnpm version
ARG PNPM_VERSION=8.6.2

# installing pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# setting working directory
WORKDIR /app

# copying package.json, pnpm-lock.yaml and tsconfig.json
COPY package.json pnpm-lock.yaml tsconfig.json prisma ./

# installing dependencies
RUN --mount=type=cache,id=pnpm,target=/node_modules \
  pnpm install --frozen-lockfile --prefer-frozen-lockfile && \
  # clearing cache
  pnpm store prune

# adding other files
COPY . .
