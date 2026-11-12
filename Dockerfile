# Keep the full tag and digest in the ARG default so both stages share the same image.
ARG BASE_IMAGE=node:24.22.2-trixie-slim@sha256:0820eaa85e07d0490446dd01d14707e17e6108a36988cf374899cd057eb3812d

FROM ${BASE_IMAGE} AS builder

WORKDIR /usr/src/app

# npm ci runs prepare, which builds the OpenAPI contract from these sources.
COPY . .
RUN npm ci --include=dev
RUN npm prune --omit=dev --ignore-scripts

# Keep production last: CircleCI builds without an explicit --target.
FROM ${BASE_IMAGE} AS production

WORKDIR /usr/src/app

RUN groupadd -g 1014 dc_user \
    && useradd -rm -d /usr/src/app -u 1015 -g dc_user dc_user

COPY --from=builder --chown=dc_user:dc_user /usr/src/app .

# npm is only needed during the build, not to run the service.
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

USER 1015

EXPOSE 3100

CMD ["node", "./bin/www"]
