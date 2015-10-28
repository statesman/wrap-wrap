module.exports = function(grunt) {
  grunt.initConfig({

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

  grunt.loadNpmTasks('grunt-express');

  // Display the test page at http://localhost:3000/
  grunt.registerTask('testpage', ['express', 'express-keepalive']);
};
