FROM 6thbridge/hgb:buffer_trait as build

FROM node:lts-alpine3.13

USER root

WORKDIR /app

COPY . .

RUN npm install && npm run build

RUN npm install -g @gmod/jbrowse-cli \
  && jbrowse --version

RUN jbrowse create static

EXPOSE 9000

WORKDIR /static

COPY /app/dist/jbrowse-plugin-hgb.umd.production.min.js /static/dist

COPY config38.json /

COPY --from=build /app/target/release/hgb /

ENTRYPOINT /hgb -t 4 vis -w 0.0.0.0 -S -R chr1:1-100000 -Y 80 -r chr1:1-1001 -W '->' '-#' jbrowse -P '-%' '-*'