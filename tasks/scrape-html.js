var cheerio = require('cheerio'),
    request = require('sync-request'),
    minify = require('html-minifier').minify;

module.exports = function(grunt) {

  'use strict';

  // Register the task
  var taskDesc = 'Scrape HTML elements from a Web page and save them as injectable JavaScript.';

  grunt.registerMultiTask('scrapehtml', taskDesc, function() {

    // Set defaults
    var options = this.options({
      makeJs: function(markup) {
        return 'document.write(' + markup + ');';
      },
      processHtml: function(markup) {
        return markup;
      },
      url: false,
      els: false
    });

    // Validate options
    if(!options.url || grunt.util.kindOf(options.url) !== 'string') {
      grunt.fail.fatal('A URL for the page to scrape is required. Set it as options.url.');
    }
    else if(grunt.util.kindOf(options.els) !== 'array') {
      grunt.fail.fatal('options.els must be an array.');
    }
    else if(grunt.util.kindOf(options.makeJs) !== 'function') {
      grunt.fail.fatal('options.makeJs must be a function.');
    }
    else if(grunt.util.kindOf(options.processHtml) !== 'function') {
      grunt.fail.fatal('options.processHtml must be a function.');
    }

    // Get the page to scrape
    var toScrape = request('GET', options.url);

    // Get the body and parse it using cheerio
    var $ = cheerio.load(toScrape.getBody('utf8'));

    // Get the html of each element specified in the options
    var markup = options.els.map(function(selector) {
      var item = $.html($(selector));
      if(item.length === 0) {
        grunt.log.warn(selector + ' not found on page.');
      }
      else {
        grunt.verbose.ok(selector + ' found.');
      }
      return item;
    });

    // Run the array of HTML through the processing function
    var processed = options.processHtml(markup);

    // Count the number of elements (for reporting in the console)
    var numEls = processed.length;

    // Join the array of HTML into a single string and minify it
    var minified = minify(processed.join('\n'), {
      collapseWhitespace: true,
      conservativeCollapse: true
    });

    // Wrap the HTML in a JavaScript call to make it injectable
    var wrapped = options.makeJs(minified);

    // Save our JavaScript
    this.files.forEach(function(file) {
      grunt.file.write(file.dest, wrapped);
      grunt.log.oklns('Saved ' + numEls + ' scraped HTML elements to "' + file.dest + '" as injectable JavaScript.');
    });

  });

};
