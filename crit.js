#!/usr/bin/env node

const axios = require('axios');
const yargs = require('yargs');

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

async function main(urls) {
   const cssPromises = urls.map(url => {
      process.stderr.write(`Gathering critical CSS for ${url}\n`);
      return generateCriticalCSS(url);
   });

   const cssArray = await Promise.all(cssPromises);

   for (const css of cssArray) {
      process.stdout.write(css);
    }

   // css = urls.map(url => {
   //    process.stderr.write(`Gathering critical CSS for ${url}\n`);
   //    generateCriticalCSS(url).then(criticalCss => {
   //       process.stdout.write(criticalCss)
   //    });
   // });

   // for (const url of urls) {
   //    process.stderr.write(`Gathering critical CSS for ${url}\n`);
   //    const criticalCss = await generateCriticalCSS(url);
   //    process.stdout.write(criticalCss);
   //  }
}

async function generateCriticalCSS (url) {
   // Fetch the HTML content from the URL
   const response = await axios.get(url);
   const html = response.data;

   // Dynamic import for the ES module
   const critical = await import('critical');

   // Generate the critical CSS using the `critical` package
   const { css } = await critical.generate({
      html: html, // the HTML to analyze
      width: 4096, // Viewport width
      height: 2160, // Viewport height
      ignore: {
         rule: validateArrayRegexes(args['exclude']),
      },

   });

   return css;
};

// When a regex is passed from a command line it converts to a string,
// so we need to convert it back to a regex
function validateArrayRegexes(arr) {
   return arr.map((str) => new RegExp(str));
}
