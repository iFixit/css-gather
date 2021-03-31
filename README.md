# css-gather
Helpful tools for working with critical CSS

`css-gather`: Fetches all the CSS files off a page and dumps their CSS to stdout.
`critical-css.js`: Uses [penthouse](https://github.com/pocketjoso/penthouse) to extract the critical CSS from CSS passed on `stdin`.
`run.sh`: Uses `css-gather` and `critical-css.js` to generate the critical CSS for a URL.

# Usage
`cd` to a clone of this repo

Fetch dependencies
```sh
gem install bundler
bundle install
npm install
```

Pass a URL to `run.sh` to generate critical CSS for it:
```sh
./run.sh https://www.ifixit.com
```
