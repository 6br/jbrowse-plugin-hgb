FROM 6thbridge/hgb:buffer_trait as stage

FROM node:lts-alpine3.13 as build

USER root

WORKDIR /app

RUN apk --no-cache add --virtual g++ gcc libgcc libstdc++ linux-headers make python3 && \
  npm install --quiet node-gyp -g

COPY . .

RUN yarn install && yarn build

FROM node:lts-alpine3.13

RUN npm install -g @gmod/jbrowse-cli \
  && jbrowse --version

RUN jbrowse create static

EXPOSE 9000

WORKDIR /static

COPY --from=build /app/dist/jbrowse-plugin-hgb.umd.production.min.js /static/dist

COPY --from=stage /app/hgb /

COPY config38.json /static/

ENTRYPOINT /hgb -t 4 vis -w 0.0.0.0 -S -R chr1:1-100000 -Y 80 -r chr1:1-1001 -W '->' '-#' jbrowse -P '-%' '-*'