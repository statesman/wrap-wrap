# wrap-wrap
This is an early attempt to take the various components in the CMG vendor wrap, documented at http://docs.cmgdigital.com/api-docs.git/wraps.html, and turn the wrap into something that can be included using a `<script>` tag in our projects.

It does that by:

1. Getting all of the `<script>` tags and bundling them into two separate files: one for the access meter and one for the remaining JavaScript.
2. Scraping all HTML tags mentioned in the documentation (specified in the [conf.yml](conf.yml.example) file), concatenating them, wrapping them in a `jQuery.append()` and bundling them with the JavaScrpt scraped in step 1.
3. Pulling out all relevant styles and concatenating them into a single tag that can be pulled in as a `<link>`.
4. Publishing the resulting files to Amazon S3 using the specified credentials. Files are gzipped and given a `Cache-Control` header to reduce requests to S3.

All files can be overridden. See the files in the overrides/ directory for an example of what is currently being overridden.

The HTML is also wrapped in a div and the CSS is namespaced to prevent collisions between code in the interactives and wrap code (such as `.header a`).

This default configuration does not scrape the access meter modals because those are customized at the CMS level in our current implementation. They can be scraped by adding `#pq-passage-quota-block` to the config. See the `modal_content_names` variable in the access meter for specifics on what the access meter is looking for.