#!/usr/bin/env ruby

require 'docopt'
require 'pathname'
require 'open-uri'
require 'logger'
require_relative './css-gather'

DIR = Pathname.new(__dir__)

def main
  opts = Docopt.docopt <<~DOCS
    Usage:
      run.rb [--include=<url>...] <url>...

    Options:
      --include=<text>  Search the specified URLs for CSS files
  DOCS
  find_critical(opts['<url>'], opts['--include'])
rescue Docopt::Exit => e
  puts e.message
end

def find_critical(urls, additional = [])
  css = fetch_page_css(urls)
  additional_css = find_css(urls, additional).join("\n")
  critical_css = reduce_to_critical(css.join("\n"), urls)
  combined_css = prettify("#{critical_css}\n#{additional_css}")
  puts postcss(combined_css)
end

def fetch_page_css(urls)
  urls.map do |url|
    CssGather.gather_css(url)
  end
end

def find_css(urls, names)
  urls.map do |url|
    names.flat_map do |name|
      regexp = Regexp.new name
      CssGather.find_stylesheets(url).flat_map do |tag|
        href = tag['href']
        if href =~ regexp
          $logger.info("Fetching #{url}")
          URI.parse(href).read
        end
      end
    end
  end
end

def reduce_to_critical(css, urls)
  subprocess(["#{__dir__}/critical-css.js", *urls], css)
end

def prettify(css)
  $logger.info('Prettifying CSS')
  Dir.chdir(__dir__) do
    subprocess(['npx', '--no-install', 'prettier', '--parser=css'], css)
  end
end

def postcss(css)
  $logger.info('Cleaning redundant CSS')
  Dir.chdir(__dir__) do
    subprocess(['npx', '--no-install', 'postcss'], css)
  end
end

## Runs `command`, piping `data` to it. Returns the stdout.
def subprocess(command, data)
  IO.popen(command, 'r+') do |io|
    io.write(data)
    # Let the process know that's all the data
    io.close_write
    io.read
  end
end

main
