# css-gather
Helpful tools for working with critical CSS

<dl>
<dt><tt>css-gather</tt></dt><dd>Fetches all the CSS files off a page and dumps their CSS to stdout.</dd>
<dt><tt>critical-css.js</tt></dt><dd>Uses <a href="https://github.com/pocketjoso/penthouse">penthouse</a> to extract the critical CSS from CSS passed on `stdin`.</dd>
<dt><tt>run.sh</tt></dt><dd>Uses `css-gather` and `critical-css.js` to generate the critical CSS for a URL.</dd>
</dl>

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
