module.exports = function(grunt) {
  grunt.initConfig({

    // Download all the <script> tags
    scrapejs: {
      options: {
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

  // Load our custom wrap-wrap tasks
  grunt.loadTasks('tasks');

  // Display the test page at http://localhost:3000/
  grunt.registerTask('testpage', ['express', 'express-keepalive']);
};
