import React from 'react'
import { observer } from 'mobx-react'
// prettier-ignore
//import {
//  BoxRendererType
//} from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import {
  ConfigurationSchema,
//  readConfObject,
} from '@jbrowse/core/configuration'

import { PrerenderedCanvas } from '@jbrowse/core/ui'
//import { bpSpanPx } from '@jbrowse/core/util'
/*import {
  createCanvas,
  createImageBitmap,
} from '@jbrowse/core/util/offscreenCanvasPonyfill'*/

// Our config schema for arc track will be basic, include just a color
export const configSchema = ConfigurationSchema(
  'HgbFeatureRenderer',
    {
    base: {
        type: 'fileLocation',
        description: 'server URL for the HGB API',
        defaultValue: {
            uri: 'http://localhost:4000/',
        },
        },
    color: {
      type: 'color',
      description: 'color for the arcs',
      defaultValue: 'darkblue',
    },
  },
  { explicitlyTyped: true },
)

// This ReactComponent is the so called "rendering" which is the component
// that contains the contents of what was rendered.

export const ReactComponent = props => {
  return (
    <div style={{ position: 'relative' }}>
      <PrerenderedCanvas {...props} />
    </div>
  )
}

// Our ArcRenderer class does the main work in it's render method
// which draws to a canvas and returns the results in a React component
function ArcRenderer(renderProps) {
    const {
      //features,
      //config,
      regions,
      bpPerPx,
      height : unadjustedHeight,
      //highResolutionScaling,
    } = renderProps
      const region = regions[0];
      const width = (region.end - region.start) / bpPerPx;
//      const height = 500;
    const YSCALEBAR_LABEL_OFFSET = 5;
    const height = unadjustedHeight - YSCALEBAR_LABEL_OFFSET * 2;
    console.log(width, height, regions);
    const range = "chr" + region.refName + ":" + region.start + "-" + region.end;
        //const feats = Array.from(features.values());
        //        const height = readConfObject(config, 'height', { feature })
    let url = "http://localhost:4000/?format=png&prefetch=True&params=-r%20" + range + "%20-U%20-x%20" + parseInt(width)+ "%20-l%20-%23%20jbrowse%20-y%2010"; // + "%20-m%2020";
    return (
        <svg width={width} height={2000}>
        <image
                width={width} /*height={height}*/
                href={url}
            />
    </svg>
    )
      // "http://localhost:4000/?format=png&prefetch=True&params=-r%20chr1:12222-2333%20-U%20"
    }


export default observer(ArcRenderer);