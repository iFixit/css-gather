# css-gather
Helpful tools for working with critical CSS

<dl>
<dt><tt>css-gather</tt></dt><dd>Fetches all the CSS files off a page and dumps their CSS to stdout.</dd>
<dt><tt>critical-css.js</tt></dt><dd>Uses <a href="https://github.com/pocketjoso/penthouse">penthouse</a> to extract the critical CSS from CSS passed on `stdin`.</dd>
<dt><tt>run.sh</tt></dt><dd>Uses `css-gather` and `critical-css.js` to generate the critical CSS for a URL.</dd>
</dl>

# Usage
`cd` to a clone of this repo

Build docker image:
```sh
docker-compose build
```

Generate critical css by running the `run.sh` command in a css-gather container and passing it a URL to analyze:

```sh
docker run css-gather ./run.rb https://www.ifixit.com
```

Generate critical css and save [screenshots](https://github.com/pocketjoso/penthouse/blob/master/examples/screenshots.js#L1-L4) in critical-css-screenshots folder:

```sh
mkdir critical-css-screenshots
docker run --mount type=bind,source="$(pwd)/critical-css-screenshots",target=/app/critical-css-screenshots css-gather ./run.rb https://www.ifixit.com
```

Generate critical css and exclude certain css selectors from the critical css:

```sh
docker run css-gather./run.rb https://www.ifixit.com/ --exclude=.skip-to-content --exclude=/#contentFloat/
```
This will remove `.skip-to-content` and any css selector that matches the `/#contentFloat/` regex.
