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

    // Get the page to scrape
    var toScrape = request('GET', options.url);

    // Get the body and parse it using cheerio
    var $ = cheerio.load(toScrape.getBody('utf8'));

    // Strip all CSS, including some inline styles
    // $('style').remove();
    // $('#flatpage_invitation').removeAttr('style');

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

    var processed = options.processHtml(markup);

    var numEls = processed.length;

    var minified = minify(processed.join('\n'), {
      collapseWhitespace: true,
      conservativeCollapse: true
    });

    var wrapped = options.makeJs(minified);

    // Save them to the specified destination
    this.files.forEach(function(file) {
      grunt.file.write(file.dest, wrapped);
      grunt.log.oklns('Saved ' + numEls + ' scraped HTML elements to "' + file.dest + '" as injectable JavaScript.');
    });

  });

};
