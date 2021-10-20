#!/bin/bash
THREADS=$1
BAM=$2
HGB=$2.hgb
SERVER=${3:-0.0.0.0:4000}

### 1. check hgb is exist
if ! command -v hgb &> /dev/null
then
    cargo install --git https://github.com/6br/hgb --branch buffer_trait
fi

### 2. check hgb

#if [ ! -f "$HGB" ]; then
#hgb -t $THREADS build $HGB -a $BAM
#fi

### 3. serve hgb rest server
hgb -t $THREADS vis -a $BAM -w $SERVER -S -R chr1:1-100000 -Y 80 -r chr1:1-1001 -W '->' '-#' jbrowse -P '-%'

