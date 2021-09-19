// @ts-nocheck
import Plugin from "@jbrowse/core/Plugin";
import PluginManager from "@jbrowse/core/PluginManager";
import rendererFactory, {
  configSchemaFactory as linearManhattanRendererConfigSchemaFactory,
} from "./LinearManhattanRenderer";
import {
  configSchemaFactory as linearManhattanDisplayConfigSchemaFactory,
  stateModelFactory as linearManhattanDisplayModelFactory,
} from "./LinearManhattanDisplay";
import {
  configSchema as HgbAdapterConfigSchema,
  AdapterClass as HgbAdapterClass,
} from "./HGBAdapter"
import svgrendererFactory, { configSchemaFactory as svgFeatureRendererConfigSchema} from './HelloRenderer'
import BoxRendererType from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import HgbDisplay from './HGBDisplay'
import ArcRenderer, {  configSchema as ArcRendererConfigSchema,  ReactComponent as ArcRendererReactComponent,} from './ArcRenderer'
export default class AlignmentsPlugin extends Plugin {
  name = "HgbPlugin";

  install(pluginManager: PluginManager) {
    const WigglePlugin = pluginManager.getPlugin(
      "WigglePlugin",
    ) as import("@jbrowse/plugin-wiggle").default;
    const DisplayType =
      pluginManager.lib["@jbrowse/core/pluggableElementTypes/DisplayType"];
    const {
      LinearWiggleDisplayReactComponent,
      XYPlotRendererReactComponent,
      //@ts-ignore
    } = WigglePlugin.exports;

    const LGVPlugin = pluginManager.getPlugin(
      'LinearGenomeViewPlugin',
    ) as import('@jbrowse/plugin-linear-genome-view').default
    const { BaseLinearDisplayComponent } = LGVPlugin.exports;

    pluginManager.addDisplayType(() => {
      const { configSchema, stateModel } = pluginManager.load(HgbDisplay);
      return new DisplayType({
        name: 'HgbDisplay',
        configSchema,
        stateModel,
        trackType: 'HgbTrack',
        viewType: 'LinearGenomeView',
        ReactComponent: BaseLinearDisplayComponent,
      })
    })


    pluginManager.addAdapterType(
      () =>
        new AdapterType({
          name: 'HgbAdapter',
          configSchema: HgbAdapterConfigSchema,
          AdapterClass: HgbAdapterClass,
        }),
    )
/*

    pluginManager.addDisplayType(() => {
      const configSchema = linearManhattanDisplayConfigSchemaFactory(
        pluginManager,
      );
      return new DisplayType({
        name: "LinearManhattanDisplay",
        configSchema,
        stateModel: linearManhattanDisplayModelFactory(
          pluginManager,
          configSchema,
        ),
        trackType: "FeatureTrack",
        viewType: "LinearGenomeView",
        ReactComponent: LinearWiggleDisplayReactComponent,
      });
    });

    pluginManager.addRendererType(() => {
      //@ts-ignore
      const ManhattanRenderer = new rendererFactory(pluginManager);
      const configSchema = linearManhattanRendererConfigSchemaFactory(
        pluginManager,
      );
      return new ManhattanRenderer({
        name: "LinearManhattanRenderer",
        ReactComponent: XYPlotRendererReactComponent,
        configSchema,
        pluginManager,
      });
    });

    pluginManager.addRendererType(() => {
      //@ts-ignore
      const SvgFeatureRenderer = new svgrendererFactory(pluginManager);
      const configSchema = svgFeatureRendererConfigSchema(
        pluginManager,
      );
      return new SvgFeatureRenderer(
        {
          name: 'SvgaFeatureRenderer',
          ReactComponent: XYPlotRendererReactComponent,
          configSchema,
          pluginManager,
        })
    })
*/
    pluginManager.addRendererType(() => {
      //@ts-ignore
      return new SvgaFeatureRenderer({
        name: 'HgbFeatureRenderer',
        ReactComponent: ArcRenderer,
        configSchema: ArcRendererConfigSchema,
        pluginManager,
      })
    })
  }
  
}
class SvgaFeatureRenderer extends BoxRendererType {
  supportsSVG = true
}