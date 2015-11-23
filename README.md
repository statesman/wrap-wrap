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

#### Scraping the wrap
- `grunt scrape`

#### Running functional tests on wrap code
- `chromedriver --port=4444 --url-base=wd/hub`
- `grunt testwrap`
