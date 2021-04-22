#!/usr/bin/env ruby

require 'docopt'
require 'pathname'
require_relative './css-gather'

DIR = Pathname.new(__dir__)

def main
  opts = Docopt.docopt <<~DOCS
    Usage: run.sh <url>...
  DOCS
  find_critical(opts['<url>'])
rescue Docopt::Exit => e
  puts e.message
end

def find_critical(urls)
  css = fetch_page_css(urls)
  critical_css = reduce_to_critical(css, urls)
  prettier_css = prettify(critical_css)
  combined_css = postcss(prettier_css)
  puts combined_css
end

def fetch_page_css(urls)
  urls.map { |url| CssGather.gather_css(url) }
end

def reduce_to_critical(css, urls)
  subprocess(["#{__dir__}/critical-css.js", *urls], css.join("\n"))
end

def prettify(css)
  Dir.chdir(__dir__) do
    subprocess(['npx', '--no-install', 'prettier', '--parser=css'], css)
  end
end

def postcss(css)
  Dir.chdir(__dir__) do
    subprocess(['npx', '--no-install', 'postcss'], css)
  end
end

## Runs `command`, piping `data` to it. Returns the stdout.
def subprocess(command, data)
  IO.popen(command, 'w') do |io|
    io.write(data)
    io.read
  end
end

main