# lets start from an image that already has nodejs installed
FROM node:22.8.0-bookworm-slim  as base

RUN groupadd -g 1014 dc_user \
    && useradd -rm -d /usr/src/app -u 1015 -g dc_user dc_user
USER dc_user

# Essentially running mkdir <name> inside the current working
# directory, and then cd <name>
WORKDIR /usr/src/app

# Bundle app source
COPY --chown=dc_user:dc_user . .

# Defult to production. npm will ignore devDependencies in production mode
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# RUN npm install
# If you are building your code for production
RUN npm ci

# Expose port 8080 inside the container to the outside world
# so that http://localhost:8080 routes the network traffic to
# the container
EXPOSE 8080

USER 1015
# the command line to run when the container is started
CMD [ "npm", "start" ]
