var fs = require('fs');

var cheerio = require('cheerio'),
    request = require('request'),
    async = require('async'),
    yaml = require('js-yaml'),
    minify = require('html-minifier').minify,
    s3 = require('s3');

var conf = yaml.safeLoad(fs.readFileSync('conf.yml', {encoding: 'utf8'}));

var s3client = s3.createClient({
  s3Options: {
    accessKeyId: conf.s3.id,
    secretAccessKey: conf.s3.key,
    region: 'us-west-2'
  },
});

request(conf.wrap, function(err, resp, body) {

  // Process JavaScript
  async.waterfall([
    function(next) {
      next(null, body);
    },
    stripScripts,
    downloadScripts,
    concatenateFiles,
    applyOverrides,
    saveFiles
  ], function(err) {
    if(err) return console.error(err);
    console.log('Scripts saved.');
  });

  // Get HTML to inject
  async.waterfall([
    function(next) {
      next(null, body);
    },
    stripHtml,
    htmlToJs,
    function(injectable, next) {
      // Put this in a format saveFiles understands
      next(null, [{
        src: injectable,
        dest: 'js/markup.js'
      }]);
    },
    saveFiles
  ], function(err) {
    if(err) return console.error(err);
    console.log('Injectable HTML saved.');
  });

  // Grab inline CSS
  async.waterfall([
    function(next) {
      next(null, body);
    },
    function(body, next) {
      $ = cheerio.load(body);
      next(null, $('style').text());
    },
    function(css, next) {
      // Put this in a format saveFiles understands
      next(null, [{
        src: css,
        dest: 'css/styles.css'
      }]);
    },
    applyOverrides,
    saveFiles
  ], function(err) {
    if(err) return console.error(err);
    console.log('CSS saved.');
  });

});


// ~ TASKS ~ //

/*
 * Strip the script tags from the wrap
 */
function stripScripts(body, next) {
  $ = cheerio.load(body);

  // Use the conf.yml settings to strip the scripts from the page
  var scripts = conf.scripts.map(function(script) {
    script.src = $(script.src).map(getScripts).get();
    return script;
  });

  next(null, scripts);
}

/*
 * Download all scripts marked external and return each script's content
 */
function downloadScripts(regions, next) {
  async.map(regions, function(region, next) {
    async.map(region.src, function(script, next) {
      if(script.type === 'external') {
        // Add protocol to protocol-relative URLs
        if(script.url.substring(0, 2) === '//') {
          script.url = 'http:' + script.url;
        }
        // Download external scripts
        request(script.url, function(err, resp, body) {
          if(err) return next(err);
          next(null, body);
        });
      }
      else {
        next(null, script.content);
      }
    }, function(err, src) {
      region.src = src;
      next(err, region);
    });
  }, next);
}

/*
 * Concatenate the scripts array into a single text string
 */
function concatenateFiles(regions, next) {
  async.map(regions, function(region, next) {
    region.src = region.src.join(';\n');
    next(null, region);
  }, next);
}

/*
 * Apply overrides (basically just append them to the end)
 */
function applyOverrides(regions, next) {
  async.map(regions, function(region, next) {
    var override = 'overrides/' + region.dest;

    if(fs.existsSync(override)) {
      region.src += fs.readFileSync(override, {encoding: 'utf8'});
    }

    next(null, region);
  }, next);
}

/*
 * Save a file
 */
function saveFiles(regions, next) {
  async.each(regions, function(region, next) {
    fs.writeFileSync('bundled/' + region.dest, region.src, {encoding: 'utf8'});

    var s3uploader = s3client.uploadFile({
      localFile: 'bundled/' + region.dest,
      s3Params: {
        Key: region.dest,
        Bucket: conf.s3.bucket,
        ACL: 'public-read'
      },
    });
    s3uploader.on('error', function(err) {
      next(err);
    });
    s3uploader.on('end', function() {
      next(null);
    });
  }, next);
}

/*
 * Extract HTML nodes as strings
 */
function stripHtml(body, next) {
  $ = cheerio.load(body);

  // Strip all CSS
  $('style').remove();

  // Get the outerHtml of each element
  async.map(conf.markup, function(node, next) {
    next(null, $.html($(node)));
  }, next);
}

/*
 * Turn HTML strings into injectable JavaScript
 */
function htmlToJs(html, next) {
  next(null, 'document.write(\'' + minify(html.join('\n'), {
    collapseWhitespace: true,
    conservativeCollapse: true
  }) + '\');');
}


// ~ HELPERS ~ //

/*
 * Runs through all of the scripts and returns an array of objects that have
 * the scripts, in order, with a URL if they're external and the content if they're
 * internal.
 */
function getScripts(i, el) {
  if(typeof $(el).attr('src') !== 'undefined') {
    return {
      type: 'external',
      url: $(el).attr('src')
    };
  }
  else {
    return {
      type: 'inline',
      content: $(el).text()
    };
  }
}
