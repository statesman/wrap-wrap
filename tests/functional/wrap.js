define(function(require) {

  var registerSuite = require('intern!object'),
    assert = require('intern/chai!assert');

  registerSuite({

    name: 'access meter',

    'first modal shows': function() {
      return this.remote
        .get(require.toUrl('tests/support/premiumtest/index.html'))
        .setFindTimeout(5000)
        .findById('pq-passage-quota-welcome')
          .isDisplayed()
        .then(function(visible) {
          assert.isTrue(visible, 'The welcome modal should show on page load');
        });
    },

    'first modal goes away': function() {
      return this.remote
        .get(require.toUrl('tests/support/premiumtest/index.html'))
        .setFindTimeout(5000)
        .findById('pq-welcome-continue')
          .click()
          .end()
        .findById('pq-welcome-continue')
          .setFindTimeout(5000)
          .isDisplayed()
        .then(function(visible) {
          assert.isFalse(visible,
            'The welcome modal should go away when the button is clicked.');
        });
    }

  });

});
