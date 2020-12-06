const fs = require('fs')
const cheerio = require('cheerio')
const fetch = require('node-fetch')

const schematics = JSON.parse(fs.readFileSync('schematics.json'))

// const firstSchematic = schematics['https://www.planetminecraft.com/project/houses-filled-with-puzzles-2/']
const secondSchematic = schematics[Object.keys(schematics)[10]]
// const result = {}

async function analyzePage (schematic) {
  const r = await fetch(schematic.url)
  const t = await r.text()
  const $ = cheerio.load(t)
  // const returnedRange = $('.num_results > .stat').text().trim()
  // console.log(page, returnedRange)
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
  const downloadLink = 'https://www.planetminecraft.com/' + $('.content-actions > li > .js_link').attr('data-href')
  const raw3rdParty = $('.content-actions > li > .third-party-download').attr('title')
  const thirdPartyDownloadLink = raw3rdParty === undefined ? raw3rdParty : raw3rdParty.replace(/Download file from mirror: /g, '')

  return { ...schematic, bigImgs, description, tags, diamondCount, views, downloads, comments, favorites, downloadLink, thirdPartyDownloadLink }
}

analyzePage(secondSchematic).then(a => console.log(a))
