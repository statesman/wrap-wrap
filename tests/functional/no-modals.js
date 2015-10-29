define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!fs',
  '../support/pages/page'
], function(registerSuite, assert, fs, Page) {

  registerSuite(function() {

    var page;

    return {

      name: 'pages with no modals',

      setup: function() {
        page = new Page(this.remote);
      },

      beforeEach: function() {
        page.reset();
      },

      '2nd page': function() {
        return page
          .doPageviews(1)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 2nd premium pageview.');
          });
      },

      '3rd page': function() {
        return page
          .doPageviews(2)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 2nd premium pageview.');
          });
      },

      '5th page': function() {
        return page
          .doPageviews(4)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 2nd premium pageview.');
          });
      }

    };

  });

});
