module.exports = function(grunt) {

  grunt.initConfig({
    connect: {
      server: {
        options: {
          port: 9500,
          hostname: '*',
          base: 'bundled',
          open: true,
          keepalive: true
        }
      }
    },

    ftpush: {
      stage: {
        auth: {
          host: 'host.coxmediagroup.com',
          port: 21,
          authKey: 'cmg'
        },
        src: 'bundled',
        dest: '/stage_aas/test/wrap-wrap',
        simple: true,
        useList: false
      },
      prod: {
        auth: {
          host: 'host.coxmediagroup.com',
          port: 21,
          authKey: 'cmg'
        },
        src: 'bundled',
        dest: '/prod_aas/projects/test/wrap-wrap',
        simple: true,
        useList: false
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-ftpush');

  grunt.registerTask('default', ['connect']);

};