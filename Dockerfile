FROM ruby:2.7.3

RUN apt-get update
Run apt-get install -y \
  curl \
  make \
  openssl \
  nodejs \
  npm

WORKDIR /app

COPY Gemfile Gemfile.lock ./

RUN gem install bundler
RUN bundle check || bundle install

COPY package.json package-lock.json ./
RUN npm install

CMD ./run.rb https://www.ifixit.com