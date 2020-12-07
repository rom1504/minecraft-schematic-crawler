const fs = require('fs')
const fetch = require('node-fetch')
const downloadBottleneck = require('./downloadBottleneck')
const tfrecord = require('tfrecord')

const fullSchematics = JSON.parse(fs.readFileSync('schematicsWithFinalUrl.json'))

async function download (schematic) {
  try {
    const r = await fetch(schematic.finalDownloadLink)
    const arrayBuffer = await r.arrayBuffer()
    const schematicData = new Uint8Array(arrayBuffer)
    return { schematicData, url: schematic.url }
  } catch (err) {
    console.log(err)
    return null
  }
}

async function writeTfRecords (filename, examples) {
  const builder = tfrecord.createBuilder()

  const writer = await tfrecord.createWriter(filename)
  for (const example of examples) {
    const enc = new TextEncoder() // always utf-8
    builder.setBinary('url', enc.encode(example.url))
    builder.setBinary('schematicData', example.schematicData)
    const exampleTf = builder.releaseExample()

    await writer.writeExample(exampleTf)
  }

  await writer.close()
}

// download(firstSchematic).then(b => console.log(b))

const a = new Date()
downloadBottleneck(fullSchematics.slice(0, 1000), download)
  .then(r => writeTfRecords('schematics.tfrecord', r))
  .then(() => console.log((new Date() - a) / 1000))
