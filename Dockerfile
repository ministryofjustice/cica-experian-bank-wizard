# Keep the full tag and digest in the ARG default so both stages share the same image.
ARG BASE_IMAGE=node:26.13.1-alpine3.23@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5

FROM ${BASE_IMAGE} AS builder

WORKDIR /usr/src/app

# npm ci runs prepare, which builds the OpenAPI contract from these sources.
COPY . .
RUN npm ci --include=dev
RUN npm prune --omit=dev --ignore-scripts

# Keep production last: CircleCI builds without an explicit --target.
FROM ${BASE_IMAGE} AS production

WORKDIR /usr/src/app

RUN addgroup -g 1014 dc_user \
    && adduser -S -D -h /usr/src/app -u 1015 -G dc_user dc_user

COPY --from=builder --chown=dc_user:dc_user /usr/src/app .

# npm is only needed during the build, not to run the service.
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

USER 1015

EXPOSE 3100

CMD ["node", "./bin/www"]
