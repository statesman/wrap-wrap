var fs = require('fs'),
    zlib = require('zlib');

var cheerio = require('cheerio'),
    request = require('request'),
    async = require('async'),
    yaml = require('js-yaml'),
    minify = require('html-minifier').minify,
    s3 = require('s3'),
    less = require('less'),
    mime = require('mime-types'),
    UglifyJS = require('uglify-js');

var conf = yaml.safeLoad(fs.readFileSync('conf.yml', {encoding: 'utf8'}));

var isAccessMeter = function(i, el) {
  var code = $(el).text();
  return code.indexOf('(function (cmg, $, janrain, plate) {') !== -1;
};

var s3client = s3.createClient({
  s3Options: {
    accessKeyId: conf.s3.id,
    secretAccessKey: conf.s3.key,
    region: 'us-west-2'
  },
});

request(conf.wrap, function(err, resp, body) {

  // Process access meter JavaScript
  async.waterfall([
    // Create the JavaScript bundle, including HTML
    function(next) {
      $ = cheerio.load(body);
      next(null, {
        src: $('script').filter(isAccessMeter).map(getScripts).get(),
        dest: 'js/access-meter.js'
      });
    },
    downloadScripts,
    concatenateFiles,
    overrideJs,
    saveFiles
  ], function(err) {
    if(err) return console.error(err);
    console.log('Scripts saved.');
  });

  // Process <body> JavaScript
  async.waterfall([
    // Get the HTML and save it
    function(next) {
      next(null, body);
    },
    stripHtml,
    wrapHtml,
    htmlToJs,
    function(injectable, next) {
      // Put this in a format saveFiles understands
      next(null, {
        src: injectable,
        dest: 'js/markup.js'
      });
    },
    saveFiles,
    function(next) {
      next(null);
    },
    // Create the JavaScript bundle, including HTML
    function(next) {
      $ = cheerio.load(body);
      next(null, {
        src: $('script').not(isAccessMeter).map(getScripts).get(),
        dest: 'js/wrap.js'
      });
    },
    filterScripts,
    downloadScripts,
    concatenateFiles,
    overrideJs,
    saveFiles
  ], function(err) {
    if(err) return console.error(err);
    console.log('Scripts saved.');
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
      next(null, {
        src: css,
        dest: 'css/styles.css'
      });
    },
    namespaceCss,
    overrideCss,
    saveFiles
  ], function(err) {
    if(err) return console.error(err);
    console.log('CSS saved.');
  });

});


// ~ TASKS ~ //

/*
 * Filter out scripts listed in the conf's blacklist
 */
function filterScripts(scripts, next) {
  scripts.src = scripts.src.filter(function(script) {
    var include = true;

    conf.scripts.blacklist.forEach(function(item) {
      if(script.type === 'external' && script.url.indexOf(item) !== -1) {
        console.log('Excluding script', script.url);
        include = false;
      }
      else if(script.type === 'inline' && script.content.indexOf(item) !== -1) {
        console.log('Excluding inline script containing"' + item + '"');
        include = false;
      }
    });

    return include;
  });

  next(null, scripts);
}

/*
 * Download all scripts marked external and return each script's content
 */
function downloadScripts(scripts, next) {
  async.map(scripts.src, function(script, next) {
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
    scripts.src = src;
    next(err, scripts);
  });
}

/*
 * Concatenate the scripts array into a single text string
 */
function concatenateFiles(scripts, next) {
  scripts.src = scripts.src.join(';\n');
  next(null, scripts);
}

/*
 * Apply JS overrides (basically just append them to the end)
 */
function overrideJs(scripts, next) {
  var override = 'overrides/' + scripts.dest;

  if(fs.existsSync(override)) {
    scripts.src += fs.readFileSync(override, {encoding: 'utf8'});
  }

  // Append the HTML
  if(scripts.dest === 'js/access-meter.js') {
    scripts.src += fs.readFileSync('bundled/js/markup.js', {encoding: 'utf8'});
  }

  scripts.src = UglifyJS.minify(scripts.src, {
    fromString: true,
    mangle: false
  }).code;

  next(null, scripts);
}

/*
 * Apply CSS overrides (basically just render LESS and append)
 */
function overrideCss(styles, next) {
  var override = 'overrides/' + styles.dest.replace('.css', '.less');

  if(fs.existsSync(override)) {
    var override_less = '\n\n/********** Begin custom overrides **********/\n';
    override_less += ('@namespace: ~"' + conf.namespace + '";\n');
    override_less += fs.readFileSync(override, {encoding: 'utf8'});

    styles.src += override_less;

    less.render(styles.src, { compress: true }, function(err, output) {
      if(err) return next(err);
      styles.src = output.css;
      next(null, styles);
    });
  }
  else {
    next(null, styles);
  }
}

/*
 * Save a file
 */
function saveFiles(item, next) {
  fs.writeFileSync('bundled/' + item.dest, item.src, {encoding: 'utf8'});

  var file_contents = fs.readFileSync('bundled/' + item.dest, { encoding: null });
  zlib.gzip(file_contents, function(err, compressed) {
    if (err) return next(err);

    fs.writeFileSync('bundled/' + item.dest + '.gz', compressed, {encoding: null});

    var s3uploader = s3client.uploadFile({
      localFile: 'bundled/' + item.dest + '.gz',
      s3Params: {
        Key: item.dest,
        Bucket: conf.s3.bucket,
        ACL: 'public-read',
        ContentEncoding: 'gzip',
        ContentType: mime.lookup(item.dest),
        CacheControl: 'max-age=60'
      },
    });
    s3uploader.on('error', function(err) {
      next(err);
    });
    s3uploader.on('end', function() {
      next(null);
    });
  });
}

/*
 * Extract HTML nodes as strings
 */
function stripHtml(body, next) {
  $ = cheerio.load(body);

  // Strip all CSS, including some inline styles
  $('style').remove();
  $('#flatpage_invitation').removeAttr('style');

  // Get the outerHtml of each element
  async.map(conf.markup, function(node, next) {
    next(null, $.html($(node)));
  }, next);
}

/*
 * Wrap HTML with a namespaced <div>
 */
function wrapHtml(html, next) {
  html.unshift('<!-- Begin CMG wrap -->\n<div id="' + conf.namespace + '">');
  html.push('</div>\n<!-- End CMG wrap -->');
  next(null, html);
}

/*
 * Turn HTML strings into injectable JavaScript
 */
function htmlToJs(html, next) {
  var minified = minify(html.join('\n'), {
    collapseWhitespace: true,
    conservativeCollapse: true
  });

  var wrapped = 'cmg.query.holdReady(true);' +
    'cmg.query("body").append(\'' +
    minified +
    '\');' +
    'cmg.query.holdReady(false);';

  //var wrapped = 'cmg.query("body").append(\'' + minified + '\');';

  next(null,  wrapped);
}

/*
 * Namespace the CSS using LESS
 */
function namespaceCss(styles, next) {
  var wrapped = '#' + conf.namespace + '{\n';
    wrapped += styles.src;
    wrapped += '\n}';

  less.render(wrapped, function(err, output) {
    if(err) return next(err);
    styles.src = output.css;
    next(null, styles);
  });
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
