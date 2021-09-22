import { ConfigurationSchema } from '@jbrowse/core/configuration'
import { types } from "mobx-state-tree";

export default pluginManager => {
  const { baseLinearDisplayConfigSchema } = pluginManager.getPlugin(
    'LinearGenomeViewPlugin',
  ).exports
  return ConfigurationSchema(
    'HgbDisplay',
    {
      renderer: pluginManager.pluggableConfigSchemaType('renderer'),
      colorScheme: {
      type: 'stringEnum',
      model: types.enumeration('colorScheme', [
        'strand',
        'normal',
        'udon',
        'base',
        'motif',
        'perBaseQuality', 
        'tag',
      ]),
      description: 'color scheme to use',
      defaultValue: 'strand',
      },
    },
    { baseConfiguration: baseLinearDisplayConfigSchema, explicitlyTyped: true },
  )
}