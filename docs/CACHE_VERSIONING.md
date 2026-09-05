# Website asset versions

The Pages workflow builds the website on every push to `main`. The build adds
`?v=<12-character SHA-256 content hash>` to local image and script URLs in HTML,
including favicons, social preview images, and literal URLs in inline scripts.
Changed assets get new versions; unchanged assets retain their versions.
External URLs are left alone. Source HTML remains directly usable from disk.

Pictogram image lists use complete relative URLs so each image can be versioned
individually. Use complete quoted asset URLs for new JavaScript-loaded images;
the build does not evaluate dynamically concatenated paths.

Run `python3 scripts/test-build-site.py` to test versioning. To preview a build,
run `python3 scripts/build-site.py --output /tmp/vidiotbox-preview` with a new or
empty output directory, then open its `index.html`. Generated output is ignored
by Git. The workflow publishes `_site` using GitHub Actions; repository Pages
settings must use the GitHub Actions publishing source.

## HTML caching limitation

On September 5, 2026, the live GitHub Pages response used
`Cache-Control: max-age=600`, along with `ETag` and `Last-Modified` validators.
GitHub Pages does not offer custom HTTP response headers. Asset versions do not
force already-cached HTML to refresh, and do not reload an already-open page.

To check HTML on every visit, a configurable host or proxy must serve HTML with
`Cache-Control: no-cache` and retain validators. Any proxy must also bypass its
own HTML cache or revalidate it; changing only the browser-facing header is not
enough if the proxy still serves stale HTML. Do not add HTML meta tags or a
`_headers` file expecting GitHub Pages to enforce them.

References:
- https://github.com/orgs/community/discussions/54257
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
