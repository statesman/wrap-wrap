module.exports = function(grunt) {
  grunt.initConfig({

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

  grunt.loadNpmTasks('intern');
  grunt.loadNpmTasks('grunt-express');

  // Display the test page at http://localhost:3000/
  grunt.registerTask('testpage', ['express', 'express-keepalive']);
};
