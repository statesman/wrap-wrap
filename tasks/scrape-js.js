var cheerio = require('cheerio'),
    request = require('sync-request');

module.exports = function(grunt) {

  'use strict';

  /**
   * Given an array of <script> els, return an array
   * of objects - returning the content for inline scripts
   * and the URL for external ones
   *
   * @param {Number} i - the element's position within the
   *   array of <script>s
   * @param {Cheerio Element} el - the element
   * @return {Object} - a string with the <script> contents
   */
  function getScripts(i, el) {
    var $ = cheerio.load(el);

    if(typeof $(el).attr('src') !== 'undefined') {
      var src = $(el).attr('src');

      // Deal with protocol-relative URLs
      if(src.substring(0, 2) === '//') {
        src = 'http:' + src;
      }

      var r = request('GET', src);

      return r.getBody('utf8');
    }
    else {
      return $(el).text();
    }
  }

  // Register the task
  var taskDesc = 'Scrape <script> tags from a Web page and save them.';

  grunt.registerMultiTask('scrapejs', taskDesc, function() {

    // Set defaults
    var options = this.options({
      url: false,
      filterContent: function(script) {
        return true;
      }
    });

    // Validate options
    if(!options.url || grunt.util.kindOf(options.url) !== 'string') {
      grunt.fail.fatal('A URL for the page to scrape is required. Set it as options.url.');
    }

    // Get the page to scrape
    var toScrape = request('GET', options.url);

    // Get the body and parse it using cheerio
    var $ = cheerio.load(toScrape.getBody('utf8'));

    // Strip out the scripts, filtering using our callback
    var scripts = $('script');

    // Count 'em
    var numScripts = scripts.length;

    // Download all of the external scripts
    scripts = scripts.map(getScripts).get();

    // Filter out scripts based on content filter
    scripts = scripts.filter(options.filterContent);
    var filteredOut = numScripts - scripts.length;

    // Concatenate all the scripts we scraped
    scripts = scripts.join(';\n');

    // Save them to the specified destination
    this.files.forEach(function(file) {
      grunt.file.write(file.dest, scripts);
      grunt.log.oklns('Scraped ' + numScripts + ' <script>s, filtered out ' +
        filteredOut + ', saved to "' + file.dest + '".');
    });

  });

};
