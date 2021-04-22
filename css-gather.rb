#!/usr/bin/env ruby

# frozen_string_literal: true

require 'docopt'
require 'nokogiri'
require 'open-uri'

module CssGather
  def self.print_styles(css)
    css.each do |stylesheet|
      case stylesheet.name
      when 'link'
        puts URI.parse(stylesheet['href']).open.read
      when 'style'
        puts stylesheet.content
      else
        die 'Unexpected node type'
      end
    end
  end

  def self.gather_css(url)
    document = Nokogiri.HTML(URI.parse(url).open)
    all_css = document.css('link[rel="stylesheet"],style')
    critical_css = all_css
                   .reject { |s| s['media'] == 'print' }
                   .reject { |s| s['id'] =~ /criticalCss|cssHide/ }
    print_styles(critical_css)
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