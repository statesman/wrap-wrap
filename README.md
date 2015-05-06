# wrap-wrap
This is an early attempt to take the various components in the CMG vendor wrap, documented at http://docs.cmgdigital.com/api-docs.git/wraps.html, and turn the wrap into something that can be included using a `<script>` tag in our projects.

**This is still a work in progress. For example, it currently uses `document.write()` and offers no solution for adding login links.**

It does that by:

1. Getting all of the `<script>` tags for both the head and body, downloading any external scripts and concatenating all of them together into a file for the head and a file for the body.
2. Scraping all HTML tags mentioned in the documentation, concatenating them, wrapping them in a `document.write()` and saving them in a single JavaScript file that can be called in the `<head>` to inject all required markup.
