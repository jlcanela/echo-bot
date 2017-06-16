FROM node:8.0.0-alpine

# Create user
RUN adduser -D service

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

USER service
EXPOSE 3000

CMD [ "node", "index.js" ]
