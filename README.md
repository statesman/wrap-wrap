# wrap-wrap
This is an early attempt to take the various components in the CMG vendor wrap, documented at http://docs.cmgdigital.com/api-docs.git/wraps.html, and turn the wrap into something that can be included using a `<script>` tag in our projects.

It does that by:

1. Getting all of the `<script>` tags for both the head and body, downloading any external scripts and concatenating all of them together into a file for the head and a file for the body.
2. Scraping all HTML tags mentioned in the documentation, concatenating them, wrapping them in a `document.write()` and saving them in a single JavaScript file that can be called in the `<head>` to inject all required markup.
3. Pulling out all inline styles and concatenating them into a single tag that can be pulled in as a `<link>`.

Each step is appended with any custom code in the overrides/ directory, then published to S3 using the credentials in the config file.

The HTML is also wrapped in a div and the CSS is namespaced to prevent collisions between code in the interactives and wrap code (such as `.header a`).
