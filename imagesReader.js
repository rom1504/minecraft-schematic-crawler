const tfrecord = require('tfrecord')

async function read () {
  const reader = await tfrecord.createReader('minecraft-schematics-dataset/images/images11800.tfrecords')
  let example
  const enc = new TextDecoder()
  while (example = await reader.readExample()) { // eslint-disable-line
    console.log(enc.decode(example.features.feature.url.bytesList.value[0]))
    console.log(enc.decode(example.features.feature.imageUrl.bytesList.value[0]))
    console.log(Buffer.from(example.features.feature.imageData.bytesList.value[0]).length)
    break
  }
}

read()
