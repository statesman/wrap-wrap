define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!fs',
  '../support/pages/page'
], function(registerSuite, assert, fs, Page) {

  registerSuite(function() {

    var page;

    return {

      name: 'upsell modal',

      setup: function() {
        page = new Page(this.remote);
      },

      afterEach: function() {
        return page.reset();
      },

      'shows on 4th page': function() {
        return page
          .doPageviews(3)
          .getPage()
          .sleep(2500)
          .takeScreenshot()
            .then(function (data) {
              fs.writeFileSync('tests/screenshots/sticky-modal.png', data);
            })
          .setFindTimeout(5000)
          .findById('pq-passage-quota-sticky')
            .isDisplayed()
          .then(function(visible) {
            assert.isTrue(visible,
              'The upsell modal should show on the 4th premium pageview');
          })
          .end();
      },

      /* We'll need to bring in the CMG modals to make this work
      'goes away when clicked': function() {
        return page
          .doPageviews(3)
          .getPage()
          .setFindTimeout(5000)
          .findByCssSelector('#pq-passage-quota-sticky .pq-access-meter-close.pq-close-modal')
            .click()
            .end()
          .findById('pq-passage-quota-sticky')
            .isDisplayed()
          .then(function(visible) {
            assert.isFalse(visible,
              'The upsell modal goes away when its close button is clicked');
          })
          .takeScreenshot()
          .then(function (data) {
            fs.writeFileSync('tests/screenshots/test-4.png', data);
          })
          .end();
      }
      */

    };

  });

});
