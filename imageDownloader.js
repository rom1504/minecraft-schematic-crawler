const fs = require('fs')
const fetch = require('node-fetch')
const downloadBottleneck = require('./downloadBottleneck')
const tfrecord = require('tfrecord')
const sharp = require('sharp')

// !wget https://gitlab.com/rom1504/minecraft-schematics-dataset/-/raw/master/schematicsWithFinalUrl.json?inline=false
const fullSchematics = JSON.parse(fs.readFileSync('schematicsWithFinalUrl.json'))


function retry(f, tries=5) {
    return f().catch(err => {
        if (tries === 0) {
            throw err
        }
        console.log('retrying '+tries)
        return retry(f, tries-1)
    })
}

async function download (schematic) {
      // download all, return array
    if (schematic.bigImgs === undefined) {
        return []
    }
    const imageUrls = typeof schematic.bigImgs === 'string' ? [schematic.bigImgs] : schematic.bigImgs
    
    return Promise.all(imageUrls.map(async (imageUrl) => {
        try {
            const imageData = await retry(async () => {
                const r = await fetch(imageUrl)
                const arrayBuffer = await r.arrayBuffer()
                const imageData = new Uint8Array(arrayBuffer)
                return imageData
            })
            return {url: schematic.url, imageUrl, imageData: await sharp(imageData)
            .resize(224, 224, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            }).toFormat('jpeg').toBuffer()}          
        } catch (err) {
            console.log(err)
            return null
        }
    }))
}

async function writeTfRecords (filename, examples) {
  const builder = tfrecord.createBuilder()

  const writer = await tfrecord.createWriter(filename)
  for (const example of examples) {
    const enc = new TextEncoder() // always utf-8
    builder.setBinary('url', enc.encode(example.url))
    builder.setBinary('imageUrl', enc.encode(example.imageUrl)) // to handle multiple image per url
    builder.setBinary('imageData', example.imageData)
    const exampleTf = builder.releaseExample()

    await writer.writeExample(exampleTf)
  }

  await writer.close()
}

async function downloadSavePerBatch (schematics, batchSize = 100) {
  console.log("total: "+ Math.ceil(schematics.length / batchSize) * batchSize)
  for (let i = 36100; i < Math.ceil(schematics.length / batchSize) * batchSize; i += batchSize) {
    try {
        const schematicsBatch = schematics.slice(i, i + batchSize)
        const data = await downloadBottleneck(schematicsBatch, download, { maxConcurrent: 100, minTime: 20 })
        const flatData = data.flat().filter(a => a !== null)
        await writeTfRecords('images/images' + i + '.tfrecords', flatData)
        console.log('batch', i + '-' + (i + batchSize))
    } catch(err) {
        console.log(err)
    }
  }
}

// download(firstSchematic).then(b => console.log(b))

downloadSavePerBatch(fullSchematics)
