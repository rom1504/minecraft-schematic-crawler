const fs = require('fs')
const fetch = require('node-fetch')
const downloadBottleneck = require('./downloadBottleneck')

const fullSchematics = JSON.parse(fs.readFileSync('fullSchematics.json'))

const goodSchematics = fullSchematics.filter(a => a !== null)

const actualSchematics = goodSchematics.filter(e => e.downloadLink !== undefined && e.downloadLink.includes('schematic'))

async function getFinalUrl (schematic) {
  try {
    const r = await fetch(schematic.downloadLink)
    const finalDownloadLink = r.url
    return { ...schematic, finalDownloadLink }
  } catch (err) {
    console.log(err)
    return null
  }
}

const a = new Date()
downloadBottleneck(actualSchematics, getFinalUrl)
  .then(r => fs.writeFile('schematicsWithFinalUrl.json', JSON.stringify(r, null, 2), () => {}))
  .then(() => console.log((new Date() - a) / 1000))
