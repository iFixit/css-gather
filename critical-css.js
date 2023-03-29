#!/usr/bin/env node

const yargs = require('yargs')
const penthouse = require('penthouse')
const fs = require("fs");
const path = require("path");

const args = yargs(process.argv.slice(2))
  .usage('$0 [url..]', 'Extract the critical CSS from the passed blob of CSS', (yargs) => {
    yargs.positional('url', {
      describe: 'The URL to compare to',
      type: 'string',
    })
  }).argv

main(args['url'])

function main(urls) {
  let cssString = ""
  process.stdin.on('data', str => cssString += str)
  process.stdin.on('end', () => {
    urls.map(url => {
      process.stderr.write(`Gathering critical CSS for ${url}\n`);
      findCriticalCss(cssString, url).then(criticalCss => {
        process.stdout.write(criticalCss)
      })
    })
  })
}

function findCriticalCss(cssString, url) {
  return penthouse({
    url,
    cssString,
    pageLoadSkipTimeout: 60000,
    renderWaitTime: 60000,
    timeout: 120000,
    width: 4096,
    height: 2160,
    screenshots: {
      basePath: getScreenshotPath(url),
      type: 'jpeg',
      quality: 100
    }
  })}

// Returns a relative path for the screenshot using the url
function getScreenshotPath(url) {
  const screenshotsDir = "critical-css-screenshots";
  // sanitize the url to use it as a filename
  const filename = url.replace(/[?/:<>"|*]/g, "-");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  return path.join(screenshotsDir, filename)
}
