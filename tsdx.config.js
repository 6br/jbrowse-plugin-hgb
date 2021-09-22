const globals = require('@jbrowse/core/ReExports/list').default
const { createJBrowsePluginTsdxConfig } = require('@jbrowse/development-tools')

module.exports = {
  rollup(config, options) {
    config.inlineDynamicImports = true
    return createJBrowsePluginTsdxConfig(config, options, globals)
  },
}
