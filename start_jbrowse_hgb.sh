#!/bin/bash

HOST=`hostname`:4000
SERVER=${1:-$HOST}

if ! command -v jbrowse &> /dev/null
then
npm install -g @jbrowse/cli
fi

jbrowse create ./jbrowse

cp config38.json ./jbrowse
cd ./jbrowse
sed -e "s/localhost:4000/$SERVER/g" -i.bak config38.json

npx serve .