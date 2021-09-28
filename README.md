# jbrowse-plugin-hgb

Plugin for displaying long-read alignments by hgb.

## Screenshot

![](img/1.png)
![](img/2.png)

## Prerequisites

* Rust (cargo)
* Node.js

## Getting Stated

The input bam file needs to be attached MD tags by `samtools calmd` and indexed by `samtools index`.

### STEP1: Serve HGB server

```bash
bash -x start_hgb_server.sh
```

### STEP2: Start JBrowse2

```bash
bash -x 
```

## Usage in jbrowse-web

Add to the "plugins" of your JBrowse Web config. The unpkg CDN should be stable, or you can download the js file to your server

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
