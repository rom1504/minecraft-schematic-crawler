const fs = require('fs')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const Bottleneck = require('bottleneck')

const schematics = JSON.parse(fs.readFileSync('schematics.json'))

// const firstSchematic = schematics['https://www.planetminecraft.com/project/houses-filled-with-puzzles-2/']
// const secondSchematic = schematics[Object.keys(schematics)[10]]
// const result = {}

async function analyzePage (schematic) {
  const r = await fetch(schematic.url)
  const t = await r.text()
  const $ = cheerio.load(t)
  const singleImage = $('.single_image > img').attr('src')
  const multipleImages = $('.gSlide > picture > img').map((i, e) => $(e).attr('src')).get()
  const bigImgs = multipleImages.length === 0 ? singleImage : multipleImages
  const description = $('.content > #r-text-block').text()
  const tags = $('#item_tags > .tag > a').map((i, e) => $(e).text()).get()
  const diamondCount = parseInt($('.resource-statistics > li > .c-num-votes').text())
  const views = parseInt($('.resource-statistics > li:contains("views")').find('span').first().text())
  const downloads = parseInt($('.resource-statistics > li:contains("downloads")').find('span').first().text())
  const comments = parseInt($('.resource-statistics > li:contains("comments")').find('span').first().text())
  const favorites = parseInt($('.resource-statistics > li:contains("favorites")').find('span').first().text())
  const downloadLink = 'https://www.planetminecraft.com' + $('.content-actions > li > .js_link').attr('data-href')
  const raw3rdParty = $('.content-actions > li > .third-party-download').attr('title')
  const thirdPartyDownloadLink = raw3rdParty === undefined ? raw3rdParty : raw3rdParty.replace(/Download file from mirror: /g, '')
  const videoLink = $('.rsNoDrag').attr('href')
  const youtubeId = videoLink === undefined ? undefined : videoLink.replace(/^.+vi\/(.+)\/.+$/, '$1')

  return { ...schematic, bigImgs, description, tags, diamondCount, views, downloads, comments, favorites, downloadLink, thirdPartyDownloadLink, youtubeId }
}

function analyzeBatch (schematics) {
  return Promise.all(schematics.map(schematic => analyzePage(schematic)))
}

async function analyzeMany (schematics, batchSize = 500) { // eslint-disable-line
  const results = []
  for (let i = 0; i < Math.ceil(schematics.length / batchSize) * batchSize; i += batchSize) {
    const schematicsBatch = schematics.slice(i, i + batchSize)
    results.push(...await analyzeBatch(schematicsBatch))
    console.log('batch', i + '-' + (i + batchSize), results.length)
  }
  return results
}

async function analyzeBottleneck (schematics) {
  let a = new Date()
  const limiter = new Bottleneck({
    maxConcurrent: 1000,
    minTime: 10
  })
  let i = 0
  return Promise.all(schematics.map(schematic => limiter.schedule(() => analyzePage(schematic).then(() => {
    i++
    if (i % 100 === 0) {
      const b = new Date()
      console.log(i, 'done in', (b - a) / 1000)
      a = b
    }
  }))))
}

// analyzePage(firstSchematic).then(a => console.log(a))
/*
const a = new Date()
analyzeMany(Object.values(schematics).slice(0,500)).then(r => fs.writeFile('fullSchematics.json', JSON.stringify(r, null, 2), () => {}))
.then(() => console.log((new Date() - a) / 1000))
*/

const a = new Date()
analyzeBottleneck(Object.values(schematics))
  .then(r => fs.writeFile('fullSchematics.json', JSON.stringify(r, null, 2), () => {}))
  .then(() => console.log((new Date() - a) / 1000))
