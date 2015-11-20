var cheerio = require('cheerio'),
    request = require('sync-request');

module.exports = function(grunt) {

  'use strict';

  // Register the task
  var taskDesc = 'Scrape CSS elements from a Web page and save them to a file.';

  grunt.registerMultiTask('scrapecss', taskDesc, function() {

    // Set defaults
    var options = this.options({
      url: false,
      els: 'style'
    });

    // Validate options
    if(!options.url || grunt.util.kindOf(options.url) !== 'string') {
      grunt.fail.fatal('A URL for the page to scrape is required. Set it as options.url.');
    }
    else if(grunt.util.kindOf(options.els) !== 'string' && grunt.util.kindOf(options.els) !== 'array') {
      grunt.fail.fatal('options.els must be a string or array.');
    }

    // Get the page to scrape
    var toScrape = request('GET', options.url);

    // Get the body and parse it using cheerio
    var $ = cheerio.load(toScrape.getBody('utf8'));

    // Normalize the els option
    if(grunt.util.kindOf(options.els) === 'string') {
      options.els = [options.els];
    }

    // Get the html of each element specified in the options
    var styles = options.els.map(function(selector) {
      var $item = $(selector);
      if($item.length === 0) {
        grunt.log.warn(selector + ' not found on page.');
      }
      else {
        grunt.verbose.ok(selector + ' found.');
      }
      return $item.text();
    });

    // Filter out empty items
    var filtered = styles.filter(function(style) {
      return style.length > 0;
    });

    // Fail if none of the specified items are found
    if(filtered.length === 0) {
      grunt.fail.warn('No elements matching options.els found on the page. No output file will be created.');
    }

    // Count the number of found elements (for reporting in the console)
    var numEls = filtered.length;

    // Join the array of CSS styles into a single string
    var joined = styles.join('\n');

    // Save our scraped CSS
    this.files.forEach(function(file) {
      grunt.file.write(file.dest, joined);
      grunt.log.oklns('Saved ' + numEls + ' scraped CSS elements to "' + file.dest + '".');
    });

  });

};
