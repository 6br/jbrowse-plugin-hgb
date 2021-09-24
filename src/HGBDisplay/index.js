import configSchemaF from './configSchema'
import modelF from './model'
//import ReactComponent from './components/HGBDisplayComponent'
export default pluginManager => {
  return {
    configSchema: pluginManager.jbrequire(configSchemaF),
    stateModel: pluginManager.jbrequire(modelF),
//    ReactComponent: pluginManager.jbrequire(ReactComponent),
  }
}