# minecraft-schematic-crawler
[![NPM version](https://img.shields.io/npm/v/minecraft-schematic-crawler.svg)](http://npmjs.com/package/minecraft-schematic-crawler)
[![Build Status](https://github.com/rom1504/minecraft-schematic-crawler/workflows/CI/badge.svg)](https://github.com/rom1504/minecraft-schematic-crawler/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Gitter](https://img.shields.io/badge/chat-on%20gitter-brightgreen.svg)](https://gitter.im/rom1504/general)
[![Irc](https://img.shields.io/badge/chat-on%20irc-brightgreen.svg)](https://irc.gitter.im/)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/rom1504/minecraft-schematic-crawler)

Automatic minecraft schematic crawler for bots and ML

## Usage

* Analyse the index page to retrieve schematics with `node indexCrawler.js`. It takes about a minute.
* Analyze each page to get more information with `node pageCrawler.js`. Takes about 20min due to the website throttling.
* Get the final urls for schematics with `node getFinalDownloadLinks.js`. Takes 5min.
* Download the schematics with `node schematicDownloader.js`
* Run `node schematicsReader.js` to see the result

## API


