import { ConfigurationReference, getConf } from "@jbrowse/core/configuration";
import { getParentRenderProps } from "@jbrowse/core/util/tracks";
import { getSession } from "@jbrowse/core/util";
import configSchemaF from "./configSchema";
import { types, getEnv } from "mobx-state-tree";
import { lazy } from "react";
import { readConfObject } from "@jbrowse/core/configuration";
import PaletteIcon from "@material-ui/icons/Palette";
import VisibilityIcon from "@material-ui/icons/Visibility";
import FilterListIcon from "@material-ui/icons/ClearAll";
import RefreshIcon from "@material-ui/icons/Refresh";
import copy from "copy-to-clipboard";

const ColorByTagDlg = lazy(() => import("./components/ColorByTag"));
const SetFeatureHeightDlg = lazy(() => import("./components/SetFeatureHeight"));
const SetMaxHeightDlg = lazy(() => import("./components/SetMaxHeight"));
const SetNumOfReadsDlg = lazy(() => import("./components/SetNumOfReads"));
const FilterByTagDlg = lazy(() => import("./components/FilterByTag"));

export default jbrowse => {
  const configSchema = jbrowse.jbrequire(configSchemaF);

  const { BaseLinearDisplay } = jbrowse.getPlugin(
    "LinearGenomeViewPlugin",
  ).exports;

  return types
    .compose(
      "HgbDisplay",
      BaseLinearDisplay,
      types.model({
        type: types.literal("HgbDisplay"),
        configuration: ConfigurationReference(configSchema),
        showCoveragePlot: types.maybe(types.boolean),
        showAlleleFreq: types.maybe(types.boolean),
        showInsertion: types.maybe(types.boolean),
        noSpacing: types.maybe(types.boolean),
        featureHeight: types.maybe(types.number),
        trackMaxHeight: types.maybe(types.number),
        numOfReads: types.maybe(types.number),
        nonce: 0,
        sortedBy: types.maybe(
          types.model({
            type: types.string,
            pos: types.number,
            tag: types.maybe(types.string),
            refName: types.string,
            assemblyName: types.string,
          }),
        ),
        colorBy: types.maybe(
          types.model({
            type: types.string,
            tag: types.maybe(types.string),
            extra: types.frozen(),
          }),
        ),
        filterBy: types.optional(
          types.model({
            flagInclude: types.optional(types.number),
            flagExclude: types.optional(types.number),
            readName: types.maybe(types.string),
            readLength: types.maybe(types.number),
            onlySplit: types.maybe(types.boolean),
            excludeSplit: types.maybe(types.boolean),
            tagFilter: types.maybe(
              types.model({ tag: types.string, value: types.string }),
            ),
          }),
        ),
      }),
    )
    .actions(self => ({
      setMaxHeight(n) {
        self.trackMaxHeight = n;
      },
      setFeatureHeight(n) {
        self.featureHeight = n;
      },
      setNumOfReads(n) {
        self.numOfReads = n;
      },
      setNoSpacing(flag) {
        self.noSpacing = flag;
      },
      updateNonce() {
        self.nonce += 1;
      },
      toggleCoveragePlot() {
        self.showCoveragePlot = !self.showCoveragePlot;
      },
      toggleAlleleFreq() {
        self.showAlleleFreq = !self.showAlleleFreq;
      },
      toggleInsertion() {
        self.showInsertion = !self.showInsertion;
      },
      setColorScheme(colorScheme) {
        self.colorBy = colorScheme;
      },
      setFilterBy(filter) {
        self.filterBy = filter;
      },
      selectFeature(feature) {
        if (feature) {
          const session = getSession(self);
          const featureWidget = session.addWidget(
            "AlignmentsFeatureWidget",
            "alignmentFeature",
            { featureData: feature }, // view: getContainingView(self)
          );
          session.showWidget(featureWidget);
          session.setSelection(feature);
        }
      },
      // uses copy-to-clipboard and generates notification
      copyFeatureToClipboard(feature) {
        const copiedFeature = feature; //.toJSON()
        delete copiedFeature.uniqueId;
        const session = getSession(self);
        copy(JSON.stringify(copiedFeature, null, 4));
        session.notify("Copied to clipboard", "success");
      },
    }))

    .views(self => {
      const {
        renderProps: superRenderProps,
        trackMenuItems: superTrackMenuItems,
      } = self;
      return {
        get rendererConfig() {
          const configBlob =
            getConf(self, ["renderers", self.rendererTypeName]) || {};
          return self.rendererType.configSchema.create(
            {
              ...configBlob,
              height: self.featureHeight,
              maxHeight: this.maxHeight,
              noSpacing: self.noSpacing,
              numOfReads: self.numOfReads,
            },
            getEnv(self),
          );
        },
        get maxHeight() {
          const conf =
            getConf(self, ["renderers", self.rendererTypeName]) || {};
          return self.trackMaxHeight !== undefined
            ? self.trackMaxHeight
            : conf.maxHeight;
        },
        get featureHeightSetting() {
          return (
            self.featureHeight || readConfObject(this.rendererConfig, "height")
          );
        },
        get numOfReadsSetting() {
          return (
            self.numOfReads || readConfObject(this.rendererConfig, "numOfReads")
          );
        },
      };
    })
    .views(self => {
      const {
        renderProps: superRenderProps,
        trackMenuItems: superTrackMenuItems,
      } = self;
      return {
        get filters() {
          return self.filterBy;
        },

        get needsScalebar() {
          return self.showCoveragePlot;
        },

        get rendererTypeName() {
          return "HgbFeatureRenderer"; //self.configuration.renderer.type
        },
        renderProps() {
          const { colorBy, filterBy } = self;
          return {
            ...superRenderProps(),
            ...getParentRenderProps(self),
            displayModel: self,
            colorBy,
            config: self.rendererConfig,
            showCoveragePlot: self.showCoveragePlot,
            showInsertion: self.showInsertion,
            showAlleleFreq: self.showAlleleFreq,
            nonce: self.nonce,
            filterBy,
          };
        },
        trackMenuItems() {
          return [
            ...superTrackMenuItems(),
            {
              label: "Refresh",
              icon: RefreshIcon,
              onClick: () => {
                self.updateNonce();
              },
            },
            {
              label: "Show coverage plot",
              icon: VisibilityIcon,
              type: "checkbox",
              checked: self.showCoveragePlot,
              onClick: () => {
                self.toggleCoveragePlot();
              },
            },
            {
              label: "Show allele frequency",
              icon: VisibilityIcon,
              type: "checkbox",
              checked: self.showAlleleFreq,
              onClick: () => {
                self.toggleAlleleFreq();
              },
            },
            {
              label: "Show insertion sequence",
              icon: VisibilityIcon,
              type: "checkbox",
              checked: self.showInsertion,
              onClick: () => {
                self.toggleInsertion();
              },
            },
            {
              label: "Color scheme",
              icon: PaletteIcon,
              subMenu: [
                {
                  label: "Strand",
                  onClick: () => {
                    self.setColorScheme({ type: "strand" });
                  },
                },
                {
                  label: "Normal",
                  onClick: () => {
                    self.setColorScheme({ type: "normal" });
                  },
                },
                {
                  label: "Udon",
                  onClick: () => {
                    self.setColorScheme({ type: "udon" });
                  },
                },
                {
                  label: "Base",
                  onClick: () => {
                    self.setColorScheme({ type: "base" });
                  },
                },
                {
                  label: "Per-base quality",
                  onClick: () => {
                    self.setColorScheme({ type: "perBaseQuality" });
                  },
                },
                {
                  label: "CpG Motif",
                  onClick: () => {
                    self.setColorScheme({ type: "motif" });
                  },
                },
                {
                  label: "Color by tag...",
                  onClick: () => {
                    getSession(self).setDialogComponent(ColorByTagDlg, {
                      model: self,
                    });
                  },
                },
              ],
            },
            {
              label: "Filter by",
              icon: FilterListIcon,
              onClick: () => {
                getSession(self).queueDialog(doneCallback => [
                  FilterByTagDlg,
                  { model: self, handleClose: doneCallback },
                ]);
              },
            },
            {
              label: "Set feature height",
              onClick: () => {
                getSession(self).queueDialog(doneCallback => [
                  SetFeatureHeightDlg,
                  { model: self, handleClose: doneCallback },
                ]);
              },
            },
            {
              label: "Set max height",
              onClick: () => {
                getSession(self).queueDialog(doneCallback => [
                  SetMaxHeightDlg,
                  { model: self, handleClose: doneCallback },
                ]);
              },
            },
            {
              label: "Set max coverage",
              onClick: () => {
                getSession(self).queueDialog(doneCallback => [
                  SetNumOfReadsDlg,
                  { model: self, handleClose: doneCallback },
                ]);
              },
            },
          ];
        },
      };
    });
};
