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
ENV SERVER_PORT=$PORT
ENV SERVER_HOSTNAME=0.0.0.0
ENV APPLICATION_NAME=openid-provider

RUN yarn --frozen-lockfile && yarn cache clean --force

CMD ["node", "/app/src/main.js"]
