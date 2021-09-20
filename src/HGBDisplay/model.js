
import { ConfigurationReference } from '@jbrowse/core/configuration'
import { getParentRenderProps } from '@jbrowse/core/util/tracks'
import { getSession } from '@jbrowse/core/util'
//import FilterListIcon from '@material-ui/icons/FilterList'
import configSchemaF from './configSchema'
import { types } from 'mobx-state-tree'

export default jbrowse => {
  const configSchema = jbrowse.jbrequire(configSchemaF)

  const { BaseLinearDisplay } = jbrowse.getPlugin(
    'LinearGenomeViewPlugin',
  ).exports

  return types
    .compose(
      'HgbDisplay',
      BaseLinearDisplay,
      types.model({
        type: types.literal('HgbDisplay'),
        configuration: ConfigurationReference(configSchema),
      }),
    )
/*
    .actions(self => ({
      openFilterConfig() {
        const session = getSession(self)
        const editor = session.addWidget('GDCFilterWidget', 'gdcFilter', {
          target: self.parentTrack.configuration,
        })
        session.showWidget(editor)
      },
      */
      .actions(self => ({
      selectFeature(feature) {
        if (feature) {
          const session = getSession(self)
          const featureWidget = session.addWidget(
            'AlignmentsFeatureWidget',
            'alignmentFeature',
            { featureData: feature }, // view: getContainingView(self)
          )
          session.showWidget(featureWidget)
          session.setSelection(feature)
        }
        },
              // uses copy-to-clipboard and generates notification
      copyFeatureToClipboard(feature) {
        const copiedFeature = feature;//.toJSON()
        delete copiedFeature.uniqueId
        const session = getSession(self)
        copy(JSON.stringify(copiedFeature, null, 4))
        session.notify('Copied to clipboard', 'success')
      },
    }))

    .views(self => {
      const {
        renderProps: superRenderProps,
        trackMenuItems: superTrackMenuItems,
      } = self
      return {
        renderProps() {
          return {
            ...superRenderProps(),
            ...getParentRenderProps(self),
            displayModel: self,
            config: self.configuration.renderer,
          }
        },

        get rendererTypeName() {
          return "HgbFeatureRenderer" //self.configuration.renderer.type
        },

        trackMenuItems() {
          return [
            ...superTrackMenuItems(),
            /*{
              label: 'Filter',
              onClick: self.openFilterConfig,
              icon: FilterListIcon,
            },*/
          ]
        },
      }
    })
}