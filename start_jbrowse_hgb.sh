#!/bin/bash

HOST=`hostname`:4000
SERVER=${1:-$HOST}
HG=${2:38}

if ! command -v jbrowse &> /dev/null
then
npm install -g @jbrowse/cli
fi

jbrowse create ./jbrowse

cp config$HG.json ./jbrowse
cd ./jbrowse
sed -e "s/localhost:4000/$SERVER/g" -i.bak config$HG.json

npx serve .