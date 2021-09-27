import React from "react";
import { observer } from "mobx-react";
import {
  ConfigurationSchema,
  readConfObject,
} from "@jbrowse/core/configuration";
// import SimpleFeature from '@jbrowse/core/util/simpleFeature'

import { PrerenderedCanvas } from "@jbrowse/core/ui";
//import { bpSpanPx } from '@jbrowse/core/util'
import { getScale } from "./util";

// Our config schema for arc track will be basic, include just a color
export const configSchema = ConfigurationSchema(
  "HgbFeatureRenderer",
  {
    base: {
      type: "fileLocation",
      description: "server URL for the HGB API",
      defaultValue: {
        uri: "http://localhost:4000/",
      },
    },
    color: {
      type: "color",
      description: "color for the arcs",
      defaultValue: "darkblue",
    },
    track: {
      type: "string",
      description: "the additional parameters to pass hgb",
      defaultValue: "",
    },
    prefix: {
      type: "string",
      description: "prefix of chromosome",
      defaultValue: "chr",
    },
    maxHeight: {
      type: "integer",
      description: "the maximum height to be used in a pileup rendering",
      defaultValue: 1200,
    },
    numOfReads: {
      type: "integer",
      description:
        "the maximum number of rows to be used in a pileup rendering",
      defaultValue: 100,
    },
    height: {
      type: "number",
      description: "the height of each feature in a pileup alignment",
      defaultValue: 12,
      contextVariable: ["feature"],
    },
    noSpacing: {
      type: "boolean",
      description: "remove insertion marks",
      defaultValue: false,
    },
  },
  { explicitlyTyped: true },
);

// This ReactComponent is the so called "rendering" which is the component
// that contains the contents of what was rendered.

export const ReactComponent = props => {
  return (
    <div style={{ position: "relative" }}>
      <PrerenderedCanvas {...props} />
    </div>
  );
};

const handleClick = (event, uri, ref, param, displayModel) => {
  //: React.MouseEvent<SVGSVGElement, MouseEvent>
  // Retrieve annotation
  //console.log(prefix, param);
  const svg = event.currentTarget;
  const pt = svg.createSVGPoint();

  pt.x = event.clientX;
  pt.y = event.clientY;

  const ctm = svg.getScreenCTM();
  if (ctm) {
    const cursorPt = pt.matrixTransform(ctm.inverse());
    // console.log(cursorPt);
    const url =
      uri +
      "read" +
      param +
      "&x=" +
      parseInt(cursorPt.x) +
      "&y=" +
      parseInt(cursorPt.y);
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data) {
          displayModel.selectFeature({
            //  session.widget.setFeatureData({
            //refName: region.refName,
            //seq:
            //  'TTGTTGCGGAGTTGAACAACGGCATTAGGAACACTTCCGTCTCTCACTTTTATACGATTATGATTGGTTCTTTAGCCTTGGTTTAGATTGGTAGTAGTAG',
            start: data[0].start,
            end: data[0].end,
            strand: (data[0].strand && 0) || 1,
            //score: 37,
            //qual:
            //  '17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17 17',
            MQ: data[0].mapq,
            CIGAR: data[0].cigar,
            //CIGAR: '100M',
            length_on_ref: data[0].end - data[0].start,
            //template_length: 0,
            seq_length: data[0].query_len,
            name: data[0].read_id,
            refName: ref,
            //type: 'match',
            id: data[0].read_id,
            flags: data[0].flag,
            insertion_position: data[1][0],
            insertion_sequence: data[1][1],
            tags: { SA: data[0].sa },
          });
        }
      });
  }
};

// Our ArcRenderer class does the main work in it's render method
// which draws to a canvas and returns the results in a React component
function ArcRenderer(renderProps) {
  const {
    //features,
    config,
    regions,
    bpPerPx,
    showCoveragePlot,
    showInsertion,
    //highResolutionScaling,
    showAlleleFreq,
    colorBy,
    filterBy,
    displayModel,
    nonce,
  } = renderProps;
  console.log(
    showCoveragePlot,
    renderProps,
    colorBy,
    config,
    readConfObject(config, "height"),
  );
  const region = regions[0];
  const width = (region.end - region.start) / bpPerPx;
  console.log(filterBy);
  const uri =
    (readConfObject(config, "base") && readConfObject(config, "base").uri) ||
    "http://localhost:4000/";
  let track = ""; // readConfObject(config, 'track');
  const prefix = readConfObject(config, "prefix") || "chr";
  const featureHeight = readConfObject(config, "height") || 15;
  const maxHeight = readConfObject(config, "maxHeight") || 2000;
  const numOfFeatures = readConfObject(config, "numOfReads") || 40;
  const noSpacing = readConfObject(config, "noSpacing") || false;
  const nonceValue = nonce || 0;
  const range =
    prefix + region.originalRefName + ":" + region.start + "-" + region.end;
  const callbackRange =
    prefix + region.refName + ":" + region.start + "-" + region.end;
  if (region.end - region.start <= 10000 && showInsertion) {
    track += "%20-{"; /// Display insertion string
  } else if (region.end - region.start >= 100000) {
    track += "%20-c";
  } else if (region.end - region.start >= 1000000) {
    track += "%20-A";
  }
  if (region.end - region.start >= 10000000) {
    return <svg width={width} height={2000}></svg>;
  } else {
    if (showCoveragePlot) {
      track += "%20-P";
      if (showAlleleFreq) {
        track += "%20-V%200.0";
      }
    }
    if (noSpacing) {
      track += "%20-I";
    }
    track += "%20-e%20-m%20" + numOfFeatures + "%20-}%20" + nonceValue;

    if (filterBy) {
      if (filterBy.flagExclude) {
        const { flagExclude } = filterBy;
        track += "%20-(%20" + flagExclude;
      }
      if (filterBy.readName && filterBy.readName !== "") {
        const { readName } = filterBy;
        track += "%20-)%20" + readName;
      }
      if (filterBy.readLength) {
        const { readLength } = filterBy;
        track += "%20-M%20" + readLength;
      }
      if (filterBy.onlySplit) {
        track += "%20-u";
      }
      if (filterBy.excludeSplit) {
        track += "%20-3";
      }
    }

    // Color configure
    if (colorBy && colorBy.type === "normal") {
      track += "%20-n";
    } else if (colorBy && colorBy.type === "udon") {
      track += "%20-U";
    } else if (colorBy && colorBy.type === "motif") {
      track += "%20-E";
    } else if (colorBy && colorBy.type === "perBaseQuality") {
      track += "%20-q";
    } else if (colorBy && colorBy.type === "tag") {
      track += "%20-0%20" + colorBy.tag;
    } else if (colorBy && colorBy.type === "base") {
      track += "%20-B";
    }

    const param =
      "?format=png&prefetch=True&params=-r%20" +
      range +
      "%20-x%20" +
      Math.ceil(width) +
      "%20-l%20-y%20" +
      featureHeight +
      "%20-%%20-7" +
      track;
    const callbackParam =
      "?format=png&prefetch=True&params=-r%20" +
      callbackRange +
      "%20-x%20" +
      Math.ceil(width) +
      "%20-l%20-y%20" +
      featureHeight +
      "%20-%%20-7" +
      track;
    const url =
      region.originalRefName === undefined ? uri + callbackParam : uri + param;
    return (
      <svg
        width={Math.ceil(width)}
        height={maxHeight}
        onClick={event =>
          handleClick(
            event,
            uri,
            prefix + region.refName,
            callbackParam,
            displayModel,
          )
        }
      >
        <image width={Math.ceil(width)} href={url} />
        {showCoveragePlot && (
          <g
            fill="none"
            font-size="10"
            font-family="sans-serif"
            text-anchor="start"
            stroke-width="1"
          >
            <path stroke="black" d="M6,80H0.5V5H6"></path>
            <g opacity="1" transform="translate(0,80)">
              <line stroke="black" x2="6" y1="0.5" y2="0.5"></line>
              <text fill="black" dy="0.32em" x="9" y="0.5">
                0
              </text>
            </g>
            <g opacity="1" transform="translate(0,61.25)">
              <line stroke="black" x2="6" y1="0.5" y2="0.5"></line>
              <text fill="black" dy="0.32em" x="9" y="0.5">
                {numOfFeatures / 4}
              </text>
            </g>
            <g opacity="1" transform="translate(0,42.5)">
              <line stroke="black" x2="6" y1="0.5" y2="0.5"></line>
              <text fill="black" dy="0.32em" x="9" y="0.5">
                {numOfFeatures / 2}
              </text>
            </g>
            <g opacity="1" transform="translate(0,23.75)">
              <line stroke="black" x2="6" y1="0.5" y2="0.5"></line>
              <text fill="black" dy="0.32em" x="9" y="0.5">
                {(numOfFeatures / 4) * 3}
              </text>
            </g>
            <g opacity="1" transform="translate(0,5)">
              <line stroke="black" x2="6" y1="0.5" y2="0.5"></line>
              <text fill="black" dy="0.32em" x="9" y="0.5">
                {numOfFeatures}
              </text>
            </g>
          </g>
        )}
      </svg>
    );
    // "http://localhost:4000/?format=png&prefetch=True&params=-r%20chr1:12222-2333%20-U%20"
  }
}

export default observer(ArcRenderer);
