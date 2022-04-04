# Step 1 - Compile code
FROM node:14.17.6-alpine as build

WORKDIR /app

COPY --chown=node:node . /app
RUN yarn --frozen-lockfile && yarn run build

# Step 2 - Prepare production image
FROM node:14.17.6-alpine

USER node
WORKDIR /app
COPY --chown=node:node --from=build /app/dist /app/package.json /app/yarn.lock /app/

ENV NODE_ENV=production
ENV LOG_LEVEL=silly
ENV PORT=3000
ENV SERVER_HOSTNAME=0.0.0.0
ENV APPLICATION_NAME=openid-provider
# TODO: Review version node -p "require('./app/package.json').version"
ENV VERSION=0.0.0
ENV AUTHENTICATION_COOKIE_KEY="X-IO-Federation-Token"

RUN yarn --frozen-lockfile && yarn cache clean --force

EXPOSE 3000
CMD ["node", "/app/main.js"]
