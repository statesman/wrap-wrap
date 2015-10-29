define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!fs',
  '../support/pages/page'
], function(registerSuite, assert, fs, Page) {

  registerSuite(function() {

    var page;

    return {

      name: 'welcome modal',

      setup: function() {
        page = new Page(this.remote);
      },

      beforeEach: function() {
        page.reset();
      },

      'shows on 1st page': function() {
        return page
          .getPage()
          .sleep(1000) // give the modal a chance to load
          .setFindTimeout(5000)
          .findById('pq-passage-quota-welcome')
            .isDisplayed()
          .then(function(visible) {
            assert.isTrue(visible,
              'The welcome modal should show on the 1st premium pageview');
          })
          .takeScreenshot()
          .then(function(data) {
            fs.writeFileSync('tests/screenshots/test-1.png', data);
          })
          .end();
      },

      'goes away when clicked': function() {
        return page
          .getPage()
          .setFindTimeout(5000)
          .findById('pq-welcome-continue')
            .click()
            .end()
          .findById('pq-passage-quota-welcome')
            .isDisplayed()
          .then(function(visible) {
            assert.isFalse(visible,
              'The welcome modal should go away when the button is clicked');
          })
          .takeScreenshot()
          .then(function(data) {
            fs.writeFileSync('tests/screenshots/test-2.png', data);
          })
          .end();
      }

    };

  });

});
