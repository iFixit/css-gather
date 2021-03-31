# css-gather
Fetches all the CSS files off a page and dumps their CSS to stdout

# Usage
`cd` to a clone of this repo

Fetch dependencies
```sh
gem install bundler
bundle install
```

Pass a URL to see all the CSS it pulls in
```sh
./css-gather https://www.ifixit.com
```
