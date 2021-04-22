#!/usr/bin/env ruby

# frozen_string_literal: true

require 'docopt'
require 'nokogiri'
require 'open-uri'

module CssGather
  def self.gather_css(url)
    critical_css = find_stylesheets(url)
    gather_stylesheets(critical_css)
  end

  def self.find_stylesheets(url)
    document = Nokogiri.HTML(URI.parse(url).open)
    all_css = document.css('link[rel="stylesheet"],style')
    all_css.reject { |s| s['media'] == 'print' }
           .reject { |s| s['id'] =~ /criticalCss|cssHide/ }
  end

  def self.gather_stylesheets(css)
    css.map do |stylesheet|
      case stylesheet.name
      when 'link'
        URI.parse(stylesheet['href']).open.read
      when 'style'
        stylesheet.content
      else
        die 'Unexpected node type'
      end
    end.join("\n")
  end
end

# docs = <<~DOC
#   Fetch CSS

#   Usage:
#     #{__FILE__} <url>
# DOC

# begin
#   opts = Docopt.docopt(docs)
#   gather_css opts['<url>']
# rescue Docopt::Exit => e
#   puts e.message
#   exit 1
# end
