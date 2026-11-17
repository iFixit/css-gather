FROM node:22-bookworm-slim AS node

FROM ruby:latest

# critical needs Node 22.13 or newer, which Debian's nodejs package is behind.
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /app

COPY Gemfile Gemfile.lock ./

RUN gem install bundler -v 2.4.6
RUN bundle check || bundle install

COPY package.json package-lock.json ./

RUN npm install

COPY . ./
