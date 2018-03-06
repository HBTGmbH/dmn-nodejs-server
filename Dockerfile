FROM debian:wheezy
MAINTAINER Andre Hegerath <andre.hegerath@hbt.de>

RUN apt-get update -y && apt-get install --no-install-recommends -y -q curl ca-certificates
RUN mkdir /nodejs && curl https://nodejs.org/dist/v8.9.4/node-v8.9.4-linux-x64.tar.xz | tar xvfJ - -C /nodejs --strip-components=1
ENV PATH $PATH:/nodejs/bin

RUN npm install -g @hbtgmbh/dmn-server

CMD ["dmn-server", "8080", "8081", "/data"]
