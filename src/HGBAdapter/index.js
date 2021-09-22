import {
    ConfigurationSchema,
  readConfObject,
  } from '@jbrowse/core/configuration'
  import { ObservableCreate } from '@jbrowse/core/util/rxjs'
  import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
//  import SimpleFeature from '@jbrowse/core/util/simpleFeature'
//  import stringify from 'json-stable-stringify'
  
  export const configSchema = ConfigurationSchema(
    'HgbAdapter',
    {
      base: {
        type: 'fileLocation',
        description: 'base URL for the HGB API',
        defaultValue: {
          uri: 'http://localhost:4000/',
        },
      },
      track: {
        type: 'string',
        description: 'the track to select data from',
        defaultValue: '',
      },
    },
    { explicitlyTyped: true, explicitIdentifier: 'HgbAdapterId' },
  )
  
  export class AdapterClass extends BaseFeatureDataAdapter {
    constructor(config) {
      super(config)
      this.config = config
    }
  
    getFeatures(region) {
      const { assemblyName, start, end, refName } = region
      return ObservableCreate(async observer => {
        const { uri } = readConfObject(this.config, 'base')
        const track = readConfObject(this.config, 'track')
        /*try {
          const result = await fetch(
            `${uri}json?` +
              `genome=${assemblyName};track=${track};` +
              `chrom=${refName};start=${start};end=${end}`,
          )
          if (result.ok) {
            const data = await result.json()
            data[track].forEach(feature => {
              observer.next(
                new SimpleFeature({
                  ...feature,
                  start: feature.chromStart,
                  end: feature.chromEnd,
                  refName: feature.chrom,
                  uniqueId: stringify(feature),
                }),
              )
            })
            observer.complete()
          }
        } catch (e) {
          //observer.error(e)
          observer.complete()
        }*/
        observer.complete()
      })
    }
  
    async getRefNames() {
      const arr = []
      for (let i = 0; i < 23; i++) {
        arr.push(`chr${i}`)
      }
      return arr
    }
  
    freeResources() {}
  }