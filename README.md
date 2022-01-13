# jbrowse-plugin-hgb

[![ci](https://github.com/6br/jbrowse-plugin-hgb/actions/workflows/ci.yml/badge.svg)](https://github.com/6br/jbrowse-plugin-hgb/actions/workflows/ci.yml)

JBrowse2 plugin for displaying long-read alignments by hgb.

## Screenshots

![](img/3.gif)
![](img/1.png)
![](img/2.png)

## Prerequisites

* Rust nightly
* Node.js
* Python3 (optional)

## Getting Started (Single Track)

The input bam file needs to be attached MD tags by `samtools calmd` and indexed by `samtools index`.

* Docker

```bash
docker run --rm -ti -p 9000:9000 -v `pwd`:/data 6thbridge/jbrowse2-hgb:master /data/<input.bam>
```

* Singularity

```bash
singularity build jb2-hgb.sif docker://6thbridge/jbrowse2-hgb:master
singularity -s run jb2-hgb.sif <input.bam>
```

Access to `http://localhost:9000/static/index.html`.

## Getting Started (Multiple Tracks)

JBrowse2-HGB works with Toil on HPC environments where communication between compute nodes is allowed and jobs are needed to be submitted using batch job system.

* Preparation

```bash
pip install virtualenv
virtualenv ~/venv
source ~/venv/bin/activate
pip install toil nginx-config-builder portpicker https://github.com/6br/toil_container

npm install -g @jbrowse/cli
```

* Single Node

```bash
python3 hgb.py jobstore --bam <input_bam> --track-names <track_name> --singularity docker://6thbridge/hgb:master
```

* Multiple Nodes w/ Batch Job Engine

```bash
python3 hgb.py jobstore --track-names BAM1 BAM2 BAM3 --bam bam1.bam bam2.bam bam3.bam --auth user:pass --singularity docker://6thbridge/hgb:master --disableCaching --batchSystem grid_engine --deadlockWait 200 --maxServiceJobs 10 --realTimeLogging

# An example for a grid engine:
TOIL_GRIDENGINE_PE='def_slot' TOIL_GRIDENGINE_ARGS="-l s_vmem=15G,mem_req=15G" python3 hgb2.py jobstore --track-names BAM1 BAM2 BAM3 --bam bam1.bam bam2.bam bam3.bam --auth user:pass --singularity docker://6thbridge/hgb:master --manualMemArgs --disableCaching --batchSystem grid_engine --deadlockWait 200 --maxServiceJobs 10 --realTimeLogging
```

After all servers are prepared, the message is displayed in red letters on the stdout of the leader process of Toil as follows:

```bash
2022-01-13 16:12:25 toil-rt [pid 72140]
CRITICAL:Access to http://<hostname>:<port>
```

Please access to `http://<hostname>:<port>`.

## Manual Deploy

### STEP1: Serve HGB server

```bash
bash -x start_hgb_server.sh $NUM_OF_THREADS $LOCATION_OF_BAM
bash -x start_hgb_server.sh $NUM_OF_THREADS $LOCATION_OF_BAM 0.0.0.0:5000
```

### STEP2: Start JBrowse2

The following command needs to run on another shell.

```bash
bash -x start_jbrowse_hgb.sh 
bash -x start_jbrowse_hgb.sh $HGB_SERVER_URL 38
bash -x start_jbrowse_hgb.sh $HGB_SERVER_URL 19
```

You can specify reference genome as the second argument as 38 or 19 (hg38 or hg19, respectively).

## Usage in jbrowse-web

Add to the "plugins" of your JBrowse Web config. The unpkg CDN should be stable, or you can download the js file to your server.

```json
{
  "plugins": [
    {
      "name": "hgb",
      "url": "https://unpkg.com/jbrowse-plugin-hgb/dist/jbrowse-plugin-hgb.umd.production.min.js"
    }
  ]
}
```

This plugin is currently quite basic, and there is no mouseover interactivity or drawn labels on features

### For use in jbrowse/react-linear-genome-view

See [DEVELOPMENT](DEVELOPMENT.md)
