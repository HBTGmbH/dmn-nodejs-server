FROM debian:wheezy
MAINTAINER Andre Hegerath <andre.hegerath@hbt.de>

RUN apt-get update -y && apt-get install --no-install-recommends -y -q curl ca-certificates
RUN mkdir /nodejs && curl https://nodejs.org/dist/v8.9.4/node-v8.9.4-linux-x64.tar.xz | tar xvfJ - -C /nodejs --strip-components=1
ENV PATH $PATH:/nodejs/bin

RUN mkdir /dmn-server && mkdir /dmn-server/src
WORKDIR /dmn-server

# ADD db db
COPY package.json ./
COPY *.js ./
COPY src/*.js ./src/
RUN npm install
CMD ["node", "bootstrap-server.js", "8080", "8081", "/data"]
