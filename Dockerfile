FROM node:lts-alpine3.13 as build

USER root

WORKDIR /app

RUN apk --no-cache add --virtual .gyp g++ gcc libgcc libstdc++ linux-headers make python3 pkgconfig pixman-dev cairo-dev pango-dev && \
  npm install --quiet node-gyp -g

COPY . .

RUN yarn install && yarn build

FROM 6thbridge/hgb:buffer_trait

WORKDIR /app

RUN apt-get update && apt-get install -y nodejs npm \
    && apt-get -y clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @gmod/jbrowse-cli \
    && jbrowse --version \
    && rm -r /app/static

RUN jbrowse create static

EXPOSE 9000

#COPY --from=stage /app/hgb /app/hgb

COPY config38.json /app/static/

COPY --from=build /app/dist/jbrowse-plugin-hgb.umd.production.min.js /app/static/dist

ENTRYPOINT ["/app/hgb", "-t", "4", "vis", "-w", "0.0.0.0:9000", "-S", "-R", "chr1:1-100000", "-Y", "80", "-r", "chr1:1-1001", "-W","->", "-#", "jbrowse", "-P", "-%", "-*", "-a"]