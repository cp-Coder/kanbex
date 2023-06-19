# setting default node version of docker image
ARG NODE_VERSION=lts-alpine

# using node image as base image
FROM node:${NODE_VERSION} as base

# setting pnpm version
ARG PNPM_VERSION=8.6.2

# installing pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate


# creating dependencies stage
FROM base as dependencies

# setting working directory
WORKDIR /app

# copying package.json, pnpm-lock.yaml and tsconfig.json
COPY package.json pnpm-lock.yaml tsconfig.json prisma ./

# installing dependencies
RUN --mount=type=cache,id=pnpm,target=/node_modules \
  pnpm install --frozen-lockfile --prefer-frozen-lockfile && \
  # generating prisma client
  pnpx prisma generate && \
  # removing cache
  pnpm store prune


# creating build stage
FROM base as build

# setting working directory
WORKDIR /app

# copying node_modules
COPY --from=dependencies /app/node_modules /app/node_modules

# copying source code
COPY . .

# building source code
RUN pnpm run build


# creating production stage
FROM base as production

# setting working directory
WORKDIR /app

# copying node_modules and dist
COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

# exposing port
EXPOSE 3000

# running application
CMD ["node", "dist/index.js"]