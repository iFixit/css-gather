#!/usr/bin/env node

const yargs = require('yargs')
const csstree = require('css-tree')

const args = yargs(process.argv.slice(2))
  .usage('$0 [url..]', 'Extract the critical CSS from the passed blob of CSS', (yargs) => {
    yargs.positional('url', {
      describe: 'The URL to compare to',
      type: 'string',
    })
    yargs.option('exclude', {
      describe: 'Remove these css selectors from the critical css',
      type: 'array',
      default: [],
    })
    yargs.option('force-include', {
      describe: 'Keep these css selectors in the critical css even when nothing in the page matches them',
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

// Critical's static engine keeps every rule whose selector matches the HTML
// the server sends. It runs no browser, so there is no viewport to pick and no
// media query is dropped.
async function findCriticalCss(cssString, url) {
  const { critical } = await import('critical');
  const exclude = validateArrayRegexes(args['exclude']);
  const forceInclude = validateArrayRegexes(args['force-include']);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
  const html = await response.text();
  const { css } = await critical({
    // The CSS to filter comes from stdin. Left in, the page's own <link> and
    // <style> tags would be read a second time, print stylesheet included.
    html: html.replace(STYLE_TAGS, ''),
    css: cssString,
    engine: 'static',
    minify: false,
  });

  const used = filterRules(css, (selector) => !matches(selector, exclude));
  const forced = forceInclude.length
    ? filterRules(cssString, (selector) => matches(selector, forceInclude), RULES_ONLY)
    : '';
  return `${used}\n${forced}\n`;
}

const STYLE_TAGS = /<link\b[^>]*rel=["']?stylesheet[^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/gi;

function matches(selector, patterns) {
  return patterns.some((pattern) =>
    pattern instanceof RegExp ? pattern.test(selector) : pattern === selector
  );
}

const RULES_ONLY = true;
const RULE_CONTAINERS = new Set(['media', 'supports', 'layer', 'container']);

// Keeps the rules, inside their at-rules, that have a selector `keep` accepts.
// With rulesOnly, at-rules that hold no rules (@font-face, @keyframes,
// @import) are dropped too: the forced pass reads the whole source CSS and
// would otherwise copy every one of them.
function filterRules(css, keep, rulesOnly = false) {
  const ast = csstree.parse(css);
  csstree.walk(ast, {
    visit: 'Rule',
    enter(rule, item, list) {
      if (this.atrule && /keyframes$/i.test(this.atrule.name)) {
        return;
      }
      if (rule.prelude.type !== 'SelectorList') {
        return;
      }
      const kept = rule.prelude.children
        .toArray()
        .filter((selector) => keep(csstree.generate(selector).trim()));
      if (kept.length) {
        rule.prelude.children.fromArray(kept);
      } else {
        list.remove(item);
      }
    },
  });
  csstree.walk(ast, {
    visit: 'Atrule',
    leave(atrule, item, list) {
      const empty = atrule.block && atrule.block.children.isEmpty;
      const holdsRules = atrule.block && RULE_CONTAINERS.has(atrule.name.toLowerCase());
      if (empty || (rulesOnly && !holdsRules)) {
        list.remove(item);
      }
    },
  });
  return csstree.generate(ast);
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
