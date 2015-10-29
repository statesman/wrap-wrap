define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!fs',
  '../support/pages/page'
], function(registerSuite, assert, fs, Page) {

  registerSuite(function() {

    var page;

    return {

      name: 'roadblock modal',

      setup: function() {
        page = new Page(this.remote);
      },

      beforeEach: function() {
        page.reset();
      },

      'shows on 6th page': function() {
        return page
          .doPageviews(5)
          .getPage()
          .setFindTimeout(5000)
          .findById('pq-passage-quota-block')
            .isDisplayed()
          .then(function(visible) {
            assert.isTrue(visible,
              'The roadblock modal should show on the 6th premium pageview');
          })
          .takeScreenshot()
          .then(function (data) {
            fs.writeFileSync('tests/screenshots/test-5.png', data);
          })
          .end();
      },

      'shows on 7th page': function() {
        return page
          .doPageviews(6)
          .getPage()
          .setFindTimeout(5000)
          .findById('pq-passage-quota-block')
            .isDisplayed()
          .then(function(visible) {
            assert.isTrue(visible,
              'The roadblock modal should show on the 6th premium pageview');
          })
          .takeScreenshot()
          .then(function (data) {
            fs.writeFileSync('tests/screenshots/test-5.png', data);
          })
          .end();
      }

    };

  });

});
