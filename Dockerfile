FROM ruby:2.7.3

RUN apt-get update
RUN apt-get install -y \
  nodejs \
  npm \
  chromium \
  libxss1

WORKDIR /app
COPY . ./

COPY Gemfile Gemfile.lock ./

RUN gem install bundler -v 2.4.6
RUN bundle check || bundle install

COPY package.json package-lock.json ./

RUN npm install
