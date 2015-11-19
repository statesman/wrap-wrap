module.exports = function(grunt) {
  grunt.initConfig({

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
          'common/javascript/writeCapture.js',
          'common/javascript/jquery.writeCapture.js'
        ],
        contentBlacklist: [
          'var googletag = googletag || {},'
        ],
        url: 'http://www.mystatesman.com/api/wraps/v1/wrap/1487/?format=html'
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
          url: 'http://www.mystatesman.com/api/wraps/v1/wrap/1487/?format=html'
        },
        dest: 'build/markup.js'
      }
    },

    concat: {
      options: {
        stripBanners: true,
      },
      'access-meter': {
        src: ['build/access-meter.js', 'overrides/hookem-access-meter.js'],
        dest: 'dist/access-meter.js',
        nonull: true
      },
      wrap: {
        src: ['build/wrap.js', 'build/markup.js', 'overrides/hookem-wrap.js'],
        dest: 'dist/wrap.js',
        nonull: true
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

    // An Express.js server that serves up the test page
    // so we can do manual testing
    express: {
      testpage: {
        options: {
          bases: 'tests/support/'
        }
      }
    }

  });

  // Load packaged tasks
  grunt.loadNpmTasks('intern');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Load our custom wrap-wrap tasks
  grunt.loadTasks('tasks');

  grunt.registerTask('scrape', ['scrapejs', 'scrapehtml', 'concat']);

  // Display the test page at http://localhost:3000/
  grunt.registerTask('testpage', ['express', 'express-keepalive']);
};
