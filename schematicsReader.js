const tfrecord = require('tfrecord')

async function read () {
  const reader = await tfrecord.createReader('schematics.tfrecord')
  let example
  const enc = new TextDecoder()
  while (example = await reader.readExample()) { // eslint-disable-line
    console.log(enc.decode(example.features.feature.url.bytesList.value[0]))
    console.log(Buffer.from(example.features.feature.schematicData.bytesList.value[0]))
    break
  }
}

read()
