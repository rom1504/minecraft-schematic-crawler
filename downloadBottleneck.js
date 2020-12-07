
const Bottleneck = require('bottleneck')

async function downloadBottleneck (schematics, f, options = { maxConcurrent: 10000, minTime: 1 }) {
  let a = new Date()
  const limiter = new Bottleneck(options)
  let i = 0
  return Promise.all(schematics.map(schematic => limiter.schedule(() => f(schematic).then(p => {
    i++
    if (i % 100 === 0) {
      const b = new Date()
      console.log(i, 'done in', (b - a) / 1000)
      a = b
    }
    return p
  }))))
}

module.exports = downloadBottleneck
