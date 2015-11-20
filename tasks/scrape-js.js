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

      grunt.log.verbose.writeln('Downloading ' + src);
      grunt.log.notverbose.write('=');

      return r.getBody('utf8');
    }
    else {
      return $(el).text();
    }
  }

  /**
   * When passed an array of blacklisted strings, use it to
   * return a filter function that excludes any passed item
   * that includes one of the blacklisted strings.
   *
   * @param {array} blackList - an array of strings that will
   *   be used to build our filter function
   * @return {function} - a function that can be used as a
   *   filter function
   */
  function doContentBlacklist(blacklist) {
    return function(script) {
      var include = true;
      blacklist.forEach(function(listitem) {
        if(script.indexOf(listitem) !== -1) {
          include = false;
        }
      });
      return include;
    };
  }

  /**
   * When passed an array of blacklisted strings, use it to
   * return a Cheerio-friendly filter function that excludes
   * any passed element that has one of the strings as its
   * HTML src attribute.
   *
   * @param {array} blackList - an array of strings that will
   *   be used to build our filter function
   * @return {function} - a function that can be used as a
   *   Cheerio filter function
   */
  function doSrcBlacklist(blacklist) {
    return function(i, el) {
      var $ = cheerio.load(el),
          src = $(el).attr('src');

      var include = true;

      blacklist.forEach(function(item) {
        if(typeof(src) !== 'undefined' && src.indexOf(item) !== -1) {
          include = false;
        }
      });

      return include;
    };
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
    else if(grunt.util.kindOf(options.filterContent) !== 'function') {
      grunt.fail.fatal('options.filterContent must be a function.');
    }

    // Get the page to scrape
    var toScrape = request('GET', options.url);

    // Get the body and parse it using cheerio
    var $ = cheerio.load(toScrape.getBody('utf8'));

    // Strip out the scripts, filtering using our callback
    var scripts = $('script');

    // Count 'em
    var numScripts = scripts.length;

    // Filter out scripts based on their source
    scripts = scripts.filter(doSrcBlacklist(options.srcBlacklist));

    // Download all of the external scripts
    grunt.log.notverbose.write('Downloading scripts [');
    scripts = scripts.map(getScripts).get();
    grunt.log.notverbose.writeln(']');

    // Filter out scripts based on content filter function and content
    // blacklist
    scripts = scripts.filter(options.filterContent);
    scripts = scripts.filter(doContentBlacklist(options.contentBlacklist));
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
