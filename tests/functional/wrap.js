define(function(require) {

  var registerSuite = require('intern!object'),
      assert = require('intern/chai!assert'),
      fs = require('intern/dojo/node!fs');

  registerSuite({

    name: 'access meter',

    'first modal shows': function() {
      return this.remote
        .get(require.toUrl('tests/support/premiumtest/1.html'))
        .setFindTimeout(5000)
        .findById('pq-passage-quota-welcome')
          .isDisplayed()
        .then(function(visible) {
          assert.isTrue(visible, 'The welcome modal should show on page load');
        })
        .takeScreenshot()
        .then(function (data) {
          fs.writeFileSync('tests/screenshots/test-1.png', data, 'base64');
        })
        .end();
    },

    'first modal goes away': function() {
      return this.remote
        .get(require.toUrl('tests/support/premiumtest/1.html'))
        .setFindTimeout(5000)
        .findById('pq-welcome-continue')
          .click()
          .end()
        .findById('pq-passage-quota-welcome')
          .setFindTimeout(5000)
          .isDisplayed()
        .then(function(visible) {
          assert.isFalse(visible,
            'The welcome modal should go away when the button is clicked.');
        })
        .takeScreenshot()
        .then(function (data) {
          fs.writeFileSync('tests/screenshots/test-2.png', data, 'base64');
        })
        .end();
    }

  });

});
