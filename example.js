const nodeFetch = require('node-fetch')
const fetch = require('fetch-cookie')(nodeFetch)
// const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')

async function analyzePage (page = 1, time = undefined) {
  const url = 'https://www.planetminecraft.com/projects/?platform=1&share=schematic' + (time === undefined ? '' : '&time_machine=' + time) + '&p=' + page
  const r = await fetch(url)
  const t = await r.text()
  const $ = cheerio.load(t)
  // const returnedRange = $('.num_results > .stat').text().trim()
  // console.log(page, returnedRange)

  const resources = $('.resource_list > li')
  const parsed = resources.map((i, r) => extractResource($(r))).get()

  return parsed
}

function extractResource (r) {
  const imgPictureDataSrc = r.find('.r-preview > a > picture > img').attr('data-src')
  const imgSrc = r.find('.r-preview > a > img').attr('src')
  const imgDataSrc = r.find('.r-preview > a > img').attr('data-src')
  const img = imgPictureDataSrc === undefined ? (imgDataSrc === undefined ? imgSrc : imgDataSrc) : imgPictureDataSrc
  const title = r.find('.r-info > a').text().trim()
  const url = 'https://www.planetminecraft.com' + r.find('.r-info > a').attr('href')
  const subtitle = r.find('.r-subtitle > .r-subject').text().trim()
  const user = r.find('.r-info > .contributed > a').text().trim()
  const date = r.find('.r-info > .contributed > abbr').attr('title')
  return { title, subtitle, img, url, user, date }
}

function crawlPageBatch (pages, schematicsResult, time) {
  return Promise.all(pages.map(page => analyzePage(page, time)
    .then(schematics =>
      schematics.forEach(schematic => {
        if (schematicsResult[schematic.url] !== undefined) {
          // console.log('found '+schematic.url+' again in page '+page)
        }
        schematicsResult[schematic.url] = schematic
      }))))
}

function sleep (time) {
  return new Promise(resolve => setTimeout(() => resolve(), time))
}

function range (size, startAt = 0) {
  return [...Array(size).keys()].map(i => i + startAt)
}

async function crawlManyPages (schematicsResult, n, time, startAt = 0, batchSize = 40, delay = 0) {
  const startBatch = Math.floor(startAt / batchSize)
  const batch = Math.ceil(n / batchSize)
  for (let batchNumber = startBatch; batchNumber < batch + startBatch; batchNumber++) {
    const r = range(batchSize, batchNumber * batchSize)
    await crawlPageBatch(r, schematicsResult, time)
    await sleep(delay)
    console.log('pages', time, r[0] + '-' + r[r.length - 1], batchNumber, Object.keys(schematicsResult).length)
  }
  return schematicsResult
}

function pad (num, size) {
  num = num.toString()
  while (num.length < size) num = '0' + num
  return num
}

async function crawlBatchOfTimeRanges (schematicsResult, times, batchSize = 30) {
  return Promise.all(times.map(time => crawlManyPages(schematicsResult, batchSize, time)))
}

async function crawlByTimeRanges (n, batchSize = 5, subBatchSize = 30) {
  const schematicsResult = {}
  const months = range(12, 1)
  const years = range(11, 10)
  const times = []
  years.forEach(year => {
    months.forEach(month => {
      const time = 'm-' + pad(month, 2) + year
      times.push(time)
    })
  })

  for (let i = 0; i < Math.ceil(times.length / batchSize) * batchSize; i += batchSize) {
    const timeBatch = times.slice(i, i + batchSize)
    await crawlBatchOfTimeRanges(schematicsResult, timeBatch, subBatchSize)
    console.log('times', timeBatch[0] + '-' + timeBatch[timeBatch.length - 1], Object.keys(schematicsResult).length)
    if (Object.keys(schematicsResult).length > n) {
      break
    }
  }

  return schematicsResult
}

// analyzePage(1, 'm-0515').then(a => console.log(a))
// const r = {}
// crawlItAll(r, 1000).then(a => console.log(Object.keys(r).length))

// crawlMore(10000).then(r => fs.writeFile('schematics.json', JSON.stringify(r, null, 2), () => {}))

crawlByTimeRanges(100000).then(r => fs.writeFile('schematics.json', JSON.stringify(r, null, 2), () => {}))
