## Requirements
- [Node.js](https://nodejs.org/) ^4.2 - `brew install node`
- [Grunt](http://gruntjs.com/) ^0.1 - `npm install -g grunt-cli`
- [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/) - `brew install chromedriver`

## Usage

#### Scraping the wrap
- `grunt scrape`

#### Running functional tests on wrap code
- `chromedriver --port=4444 --url-base=wd/hub`
- `grunt testwrap`
