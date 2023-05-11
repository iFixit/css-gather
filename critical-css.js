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
    yargs.option('exclude', {
      describe: 'Exclude css selectors to remove in critical css (the `forceExclude` option in penthouse)',
      type: 'array',
      default: [],
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
  const excludeArr = validateArrayRegexes(args['exclude']);

  return penthouse({
    url,
    cssString,
    pageLoadSkipTimeout: 60000,
    renderWaitTime: 60000,
    timeout: 120000,
    width: 4096,
    height: 2160,
    blockJSRequests: false,
    forceExclude: excludeArr,
    forceInclude: [/^:(\w+)\(/i],
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

// When a regex is passed from a command line it converts to a string,
// so we need to convert it back to a regex
function validateArrayRegexes(arr) {
  return arr.map((str) => {
    if (str.startsWith("/") && str.lastIndexOf("/") > 0) {
      // Extract the regular expression pattern and flags from the string
      const lastSlashIndex = str.lastIndexOf("/");
      const pattern = str.substring(1, lastSlashIndex);
      const flags = str.substring(lastSlashIndex + 1);
      // Create a new RegExp object with the pattern and flags
      try {
        return new RegExp(pattern, flags);
      } catch (error) {
        return str;
      }
    } else {
      return str;
    }
  });
}
