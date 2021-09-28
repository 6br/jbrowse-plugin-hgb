#!/bin/bash

SERVER=${1:-0.0.0.0:4000}

if ! command -v jbrowse &> /dev/null
then
npm install -g @jbrowse/cli
fi

jbrowse create ./jbrowse

cp config38.json ./jbrowse
sed -i

cd ./jbrowse


npx serve .