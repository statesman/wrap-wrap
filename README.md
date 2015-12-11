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

## Copyright

&copy; 2015 Austin American-Statesman
