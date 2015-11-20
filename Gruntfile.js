module.exports = function(grunt) {
  grunt.initConfig({

    wrapUrl: 'http://www.mystatesman.com/api/wraps/v1/wrap/1487/?format=html',

    // Download all the <script> tags
    scrapejs: {
      options: {
        srcBlacklist: [
          'common/premium/js/bootstrap-transition.js',
          'common/premium/js/bootstrap-modalmanager.js',
          'common/premium/js/bootstrap-modal-ext.js',
          'common/premium/js/bootstrap-dropdown.js',
          'common/premium/js/bootstrap-collapse.js',
          'www.googletagservices.com/tag/js/gpt.js',
          'common/premium/js/cmg-header.js',
          'common/premium/js/jquery.placeholder.min.js',
          'common/lib/lazythumbs/js/lazythumbs.js',
        ],
        contentBlacklist: [
          'var googletag = googletag || {},'
        ],
        url: "<%= wrapUrl %>"
      },
      'access-meter': {
        options: {
          filterContent: function(script) {
            return script.indexOf('(function (cmg, $, janrain, plate) {') !== -1;
          }
        },
        dest: 'build/access-meter.js'
      },
      wrap: {
        options: {
          filterContent: function(script) {
            return script.indexOf('(function (cmg, $, janrain, plate) {') === -1;
          }
        },
        dest: 'build/wrap.js'
      }
    },

    // Scrape inline styles from the page and save it as CSS
    scrapecss: {
      options: {
        url: "<%= wrapUrl %>",
        els: 'style'
      },
      wrap: {
        dest: 'dist/wrap.css'
      }
    },

    // Scrape markup from the page and save it as JavaScript
    scrapehtml: {
      options: {
        els: [
          //Janraid markup
          '#flatpage_frame',
          '#returnSocial',
          '#returnTraditional',
          '#socialRegistration',
          '#traditionalRegistration',
          '#traditionalRegistrationBlank',
          '#registrationSuccess',
          '#registrationSuccessConfirmed',
          '#forgotPassword',
          '#forgotPasswordSuccess',
          '#mergeAccounts',
          '#traditionalAuthenticateMerge',
          '#resendVerification',
          '#resendVerificationSuccess',
          // Not in the CMG docs, but required
          '#signIn'
        ],
        processHtml: function(markup) {
          markup.unshift('<!-- Begin CMG wrap -->\n<div id="#cmg-wrap-aas">');
          markup.push('</div>\n<!-- End CMG wrap -->');
          return markup;
        },
        makeJs: function(markup) {
          return 'cmg.query.holdReady(true);' +
            'cmg.query("body").append(\'' +
            markup +
            '\');' +
            'cmg.query.holdReady(false);';
        }
      },
      markup: {
        options: {
          url: "<%= wrapUrl %>"
        },
        dest: 'build/markup.js'
      }
    },

    uglify: {
      options: {
        mangle: false,
        compress: true,
        report: 'gzip',
        preserveComments: false,
      },
      hookem: {
        files: {
          'dist/access-meter.js': ['build/access-meter.js', 'overrides/hookem-access-meter.js'],
          'dist/wrap.js': ['build/wrap.js', 'build/markup.js', 'overrides/hookem-wrap.js']
        }
      }
    },

    // Run our tests using intern.js
    intern: {
      'wrap-wrap': {
        options: {
          runType: 'runner',
          config: 'tests/intern',
          reporters: [ 'Console' ]
        }
      }
    },

    // An Express.js app that serves up a test page
    // for manual testing and automated functional tests
    express: {
      options: {
        server: 'tests/support/testserver/app'
      },
      testpage: {
        options: {
          port: 3000,
          open: 'http://localhost:3000/free/1/'
        }
      },
      testserver: {
        options: {
          port: 3001
        }
      }
    },

    // Upload our compiled files to Amazon S3
    aws: grunt.file.readJSON('aws-credentials.json'),

    s3: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        bucket: 'wrap.hookem.com',
        region: 'us-west-2'
      },
      wrap: {
        cwd: 'dist/',
        src: '**'
      }
    }

  });

  // Load packaged tasks
  grunt.loadNpmTasks('intern');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-aws');

  // Load our custom wrap-wrap tasks
  grunt.loadTasks('tasks');

  // Scrape the wrap
  grunt.registerTask('scrape', ['scrapejs', 'scrapehtml', 'scrapecss', 'uglify']);

  // Run functional tests on scraped wrap code
  grunt.registerTask('testwrap', ['express:testserver', 'intern']);

  // Display the test page at http://localhost:3000/
  grunt.registerTask('testpage', ['express:testpage', 'express-keepalive']);

  // Our master task that scrapes the wrap, then tests it
  grunt.registerTask('wrap', ['scrape', 'testwrap', 's3']);
};
