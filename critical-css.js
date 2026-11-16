#!/usr/bin/env node

const yargs = require('yargs')
const penthouse = require('penthouse')
const csstree = require('css-tree')
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
    yargs.option('force-include', {
      describe: 'Keep css selectors in critical css even when they are not above the fold (the `forceInclude` option in penthouse)',
      type: 'array',
      default: [],
    })
  }).argv

main(args['url'])

async function main(urls) {
  let cssString = ""
  process.stdin.on('data', str => cssString += str)
  process.stdin.on('end', async () => {
    const cssPromises = urls.map(url => {
      process.stderr.write(`Gathering critical CSS for ${url}\n`);
      return findCriticalCss(cssString, url);
    });

    const cssArray = await Promise.all(cssPromises);

    for (const css of cssArray) {
       process.stdout.write(css);
    }
  })
}

// Penthouse drops every media query that doesn't match its viewport, so a
// desktop-only pass leaves out the phone layout's max-width rules. The phone
// pass keeps what the desktop pass kept, so the result is one filter over the
// source CSS and the cascade order stays intact.
async function findCriticalCss(cssString, url) {
  const excludeArr = validateArrayRegexes(args['exclude']);
  const forceIncludeArr = validateArrayRegexes(args['force-include']);
  const options = {
    url,
    cssString,
    pageLoadSkipTimeout: 60000,
    renderWaitTime: 60000,
    timeout: 120000,
    blockJSRequests: false,
    forceExclude: excludeArr,
  };

  const desktopCss = await penthouse({
    ...options,
    width: 4096,
    height: 2160,
    forceInclude: forceIncludeArr,
    screenshots: screenshotOptions(url, 'desktop'),
  });

  return penthouse({
    ...options,
    width: 412,
    height: 915,
    userAgent: PHONE_USER_AGENT,
    keepLargerMediaQueries: true,
    forceInclude: [...forceIncludeArr, ...selectorsIn(desktopCss)],
    screenshots: screenshotOptions(url, 'phone'),
  });
}

const PHONE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

// Generated with the css-tree build penthouse uses, so each string equals
// the selector penthouse compares against forceInclude.
function selectorsIn(css) {
  const selectors = new Set();
  csstree.walk(csstree.parse(css), {
    visit: 'Rule',
    enter(rule) {
      if (rule.prelude.type !== 'SelectorList') {
        return;
      }
      rule.prelude.children.each((selector) => {
        selectors.add(csstree.generate(selector).trim());
      });
    },
  });
  return [...selectors];
}

function screenshotOptions(url, viewport) {
  return {
    basePath: `${getScreenshotPath(url)}-${viewport}`,
    type: 'jpeg',
    quality: 100,
  };
}

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
