define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!fs',
  '../support/pages/page'
], function(registerSuite, assert, fs, Page) {

  registerSuite(function() {

    /**
     * Return a functional test function that asserts a modal isn't
     * shown on the {nth} {premium} pageview.
     *
     * @param {Number} nth - the pageview number we're testing; ex: passing
     *   2 would test that there's no modal on the second pageview
     * @param {boolean} premium - whether to test premium pageviews or free
     *   ones
     * @param {string} ordinal - an ordinal version of the {nth} param, used
     *   to build the assertion language
     * @return {function} - the test function
     */
    function noModalTest(nth, premium, ord) {
      return function() {
        return page
          .setPremium(premium)
          .doPageviews(nth - 1)
          .noModals(page.getPage())
          .then(function(noModals) {
            assert.isTrue(noModals,
              'There should be no modals on the ' + ord + ' premium pageview.');
          });
      };
    }

    var page;

    return {

      name: 'pages with no modals',

      setup: function() {
        page = new Page(this.remote);
      },

      beforeEach: function() {
        page.reset();
      },

      '2nd premium pageview': noModalTest(2, true, '2nd'),
      '3rd premium pageview': noModalTest(3, true, '3rd'),
      '5th premium pageview': noModalTest(5, true, '5th'),

      '1st free pageview': noModalTest(1, false, '1st'),
      '2nd free pageview': noModalTest(2, false, '2nd'),
      '3rd free pageview': noModalTest(3, false, '3rd'),
      '4th free pageview': noModalTest(4, false, '4th'),

      /**
       * A hacky test that doesn't really assert anything and just
       * makes a screenshot for our status report
       */
      '1st free pageview (screenshot)': function() {
        return page
          .setPremium(false)
          .getPage()
          .takeScreenshot()
            .then(function(data) {
              fs.writeFileSync('tests/screenshots/no-modals.png', data);
              assert.isTrue(true);
            });
      }

    };

  });

});
