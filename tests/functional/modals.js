define(function(require) {

  var registerSuite = require('intern!object'),
      assert = require('intern/chai!assert'),
      fs = require('intern/dojo/node!fs');

  var firstPage = 'tests/support/premiumtest/1.html',
      secondPage = 'tests/support/premiumtest/2.html';

  registerSuite({

    name: 'access meter - page 1',

    'modal shows': function() {
      return this.remote
        .get(require.toUrl(firstPage))
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

    'modal goes away': function() {
      return this.remote
        .get(require.toUrl(firstPage))
        .setFindTimeout(5000)
        .findById('pq-welcome-continue')
          .click()
          .end()
        .findById('pq-passage-quota-welcome')
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

  registerSuite({

    name: 'access meter - page 2',

    'no modal shows': function() {
      return this.remote
        .get(require.toUrl(firstPage))
        .get(require.toUrl(secondPage))
        .setFindTimeout(5000)
        .findById('pq-passage-quota-welcome')
          .isDisplayed()
        .then(function(visible) {
          assert.isFalse(visible,
            'The welcome modal shouldn\'t show on load for a second page');
        })
        .takeScreenshot()
        .then(function (data) {
          fs.writeFileSync('tests/screenshots/test-3.png', data, 'base64');
        })
        .end();
    }

  });

});
