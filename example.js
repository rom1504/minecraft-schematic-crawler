const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')

async function analyzePage (page = 1, time) {
  const url = 'https://www.planetminecraft.com/projects/?platform=1&share=schematic' + (time === undefined ? '' : '&time_machine=' + time) + '&p=' + page
  const r = await fetch(url)
  const t = await r.text()
  const $ = cheerio.load(t)

  const resources = $('.resource_list > li')
  const parsed = resources.map((i, r) => extractResource($(r))).get()

  return parsed
}

function extractResource (r) {
  const img = r.find('.r-preview > a > picture > img').attr('data-src')
  const title = r.find('.r-info > a').text().trim()
  const url = 'https://www.planetminecraft.com' + r.find('.r-info > a').attr('href')
  const subtitle = r.find('.r-subtitle > .r-subject').text().trim()
  const user = r.find('.r-info > .contributed > a').text().trim()
  const date = r.find('.r-info > .contributed > abbr').attr('title')
  return { title, subtitle, img, url, user, date }
}

function crawBatch (pages, schematicsResult, time) {
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

async function crawlItAll (schematicsResult, n, time, startAt = 0, batchSize = 50, delay = 0) {
  const startBatch = Math.floor(startAt / batchSize)
  const batch = Math.ceil(n / batchSize)
  for (let batchNumber = startBatch; batchNumber < batch + startBatch; batchNumber++) {
    const r = range(batchSize, batchNumber * batchSize)
    await crawBatch(r, schematicsResult, time)
    await sleep(delay)
    console.log(r[0] + '-' + r[r.length - 1], batchNumber, Object.keys(schematicsResult).length)
  }
  return schematicsResult
}

function pad (num, size) {
  num = num.toString()
  while (num.length < size) num = '0' + num
  return num
}

async function crawlMore (n) {
  const schematicsResult = {}
  const months = range(12, 1)
  const years = range(5, 15)
  const times = []
  years.forEach(year => {
    months.forEach(month => {
      const time = 'm-' + pad(month, 2) + year
      times.push(time)
    })
  })
  for (const time of times) {
    await crawlItAll(schematicsResult, 30, time)
    console.log(time, Object.keys(schematicsResult).length)
    if (Object.keys(schematicsResult).length > n) {
      break
    }
  }
  return schematicsResult
}

crawlMore(10000).then(r => fs.writeFile('schematics.json', JSON.stringify(r, null, 2), () => {}))
