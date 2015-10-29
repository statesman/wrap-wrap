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

      '2nd premium pageview': function() {
        return page
          .doPageviews(1)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 2nd premium pageview.');
          });
      },

      '3rd premium pageview': function() {
        return page
          .doPageviews(2)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 2nd premium pageview.');
          });
      },

      '5th premium pageview': function() {
        return page
          .doPageviews(4)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 2nd premium pageview.');
          });
      },

      '1st free pageview': function() {
        return page
          .setPremium(false)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 1st free pageview.');
          });
      },

      '2nd free pageview': function() {
        return page
          .setPremium(false)
          .doPageviews(1)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 2nd free pageview.');
          });
      },

      '3rd free pageview': function() {
        return page
          .setPremium(false)
          .doPageviews(2)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 3rd free pageview.');
          });
      },

      '4th free pageview': function() {
        return page
          .setPremium(false)
          .doPageviews(3)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the 4th free pageview.');
          });
      }

    };

  });

});
