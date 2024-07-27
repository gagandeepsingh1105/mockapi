FROM node:18-alpine

ENV NODE_ENV development

WORKDIR /app

COPY package.json ./

RUN npm i

COPY ./schema.js .
COPY ./server.js .

USER node

EXPOSE 8080

CMD npm run start