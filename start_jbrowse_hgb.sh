#!/bin/bash

SERVER=${1:-0.0.0.0:4000}

npm install -g @jbrowse/cli
jbrowse create ./jbrowse

cp config38.json ./jbrowse
sed -i

cd ./jbrowse


npx serve .