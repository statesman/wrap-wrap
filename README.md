# wrap-wrap

We use wrap-wrap to scrape the JavaScript, CSS and HTML from a wrap endpoint in Medley and drop the scraped contents onto Amazon S3, allowing us to import essential Medley components like authentication, metrics and advertising on outside projects using `<script>` and `<link>` tags.

Most of the custom behavior in wrap-wrap is handled by a series of Grunt tasks, which live in a [separate repository](https://github.com/statesman/grunt-wrap-scrape). This repository is mostly [configuration](Gruntfile.js), integration with other Grunt tasks for easily-vendored behavior (script minification, Amazon S3 uploading, etc.) and [functional tests](tests/intern.js).

## Requirements
- [Node.js](https://nodejs.org/) ^4.2 - `brew install node`
- [Grunt](http://gruntjs.com/) ^0.1 - `npm install -g grunt-cli`
- [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/) - `brew install chromedriver`

## Usage

#### Installing
1. Install node modules with `npm install`
2. Make an entry in your local hosts file to point `local-dev.mystatesman.com` to your local dev environment. [`hostile`](https://github.com/feross/hostile) is an open-source, Node-based tool that can be used for this but there are many other ways to handle this change:

  ```
  $ npm install -g hostile
  $ sudo hostile set 127.0.0.1 local-dev.mystatesman.com
  ```

3. Add a secrets.json file to the project root with site login information and AWS keys:

  ```json
  {
    "aws": {
      "accessKeyId": "~ AWS ACCESS KEY ~",
      "secretAccessKey": "~ AWS SECRET KEY ~"
    },
    "login": {
      "username": "~ MYSTATESMAN.COM USERNAME ~",
      "password": "~ MYSTATESMAN.COM PASSWORD ~"
    }
  }
  ```

#### Scraping and publishing the wrap

During a complete run of our Grunt tasks using `grunt wrap`, wrap-wrap would:

1. Use the `scrapehtml` task to grab needed HTMl from the wrap and save it as injectable JavaScript in two files - one with the modals and one with everything else.
2. Grab all inline styles with `scrapecss` and combine it with some other external stylesheets and overrides in the `less` task.
3. Get JavaScript using the `scrapejs` task, combine it with our [overrides](overrides/), uglify it and output it into four files - the access meter code, all other scraped JavaScript, injectable modals and other injectable HTML.
4. Run functional tests locally using Intern on the scraped files.
5. Upload those files to Amazon S3 and invalidate the files in CloudFront's cache.

Subsets of the above can also be triggered using the included Grunt multitasks:
- `grunt scrape`: Runs steps 1 through 3 above.
- `grunt testwrap`: Runs step 4 above.
- `grunt upload`: Runs step 5 above.
- `grunt testpage`: Opens a local Express server that allows for manual testing of scraped code and viewing of any screenshots generated during Intern's functional tests.

**Important note:** Chromedriver must be running for Chromedriver to run functional tests. If `chromedriver` is in your `$PATH` should be able to start it using `chromedriver --port=4444 --url-base=wd/hub`.

## Using the wrap

To make use of all the wrap's functionality you'll need to include the output files on your page. Specifically:
- include [*wrap.js*](http://wrap.hookem.com/wrap.js) as close as possible to the opening `<body>` tag (the distance between *wrap.js* and *access-meter.js* in your markup is essential to preventing race conditions from interfering with the wrap code)
- include [*access-meter.js*](http://wrap.hookem.com/access-meter.js) as close as possible to the closing `<body>` tag
- include [*wrap.css*](http://wrap.hookem.com/wrap.css) in the `<head>` of your page
- **Optional:** include [*modals.js*](http://wrap.hookem.com/modals.js) below *wrap.js* to get the access meter modals; alternatively, you can include your own modals on the page

#### Marking content as non-premium

By default all content will be marked as premium and trigger the access meter. If you'd like to mark content as non-premium, create a `wrap` object and place it before any of your external wrap files:

```js
var wrap = {
  premium: false
}
```

#### Adding login/logout links

It's also possible to add login/logout to your page. The wrap will look for a few key classes that you should include. For example:

```html
<a title="Log out" class="cmUserAuthed cmLogout capture_end_session" href="#">Log out</a>
<a title="Log in" class="cmUserAnonymous cmOpenJanrainModal" href="#">Log in</a>
```

The default behavior on the minimalist wrap is to show both the login and logout links and hide the unneeded when a user's authentication status has been determined. It's possible to alter that behavior, so the login link shows initially and is swapped to the logout link if applicable:

```css
.cmLogout {
  display: none;
}
```

#### Example

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="path/to/wrap.css">
    <script>
    // Optional: Mark content as non-premium
    var wrap = {
      premium: false
    };
    </script>
  </head>
  <body>
    <script src="path/to/wrap.js"></script>

    <!-- Optional: You could use your own modals instead -->
    <script src="path/to/modals.js"></script>

    <!-- Your app's HTML -->

    <script src="path/to/access-meter.js"></script>
  </body>
</html>
```

## Copyright

&copy; 2015 Austin American-Statesman
