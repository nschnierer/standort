FROM node:18-alpine AS base

RUN apk update
RUN apk add --no-cache libc6-compat openssl1.1-compat
RUN npm i -g turbo

#
# Signaling
#

# See https://turbo.build/repo/docs/handbook/deploying-with-docker
FROM base AS signaling-pruned
WORKDIR /app
COPY . .
RUN turbo prune --scope=signaling --docker

## Add build step signaling
FROM base AS signaling
WORKDIR /app

# Just copy the package.json and package-lock.json files
# to cache the install step.
COPY --from=signaling-pruned /app/out/json/ .
COPY --from=signaling-pruned /app/out/package-lock.json ./package-lock.json
RUN npm ci

## Copy the rest of the files
COPY --from=signaling-pruned /app/out/full/ .
COPY turbo.json turbo.json
RUN turbo run build

ENTRYPOINT ["npm", "run", "start", "--workspace=signaling"]
