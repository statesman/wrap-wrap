define(function(require) {

  var registerSuite = require('intern!object'),
      assert = require('intern/chai!assert');

  registerSuite({

    name: 'wrap',

    'login form': function() {
      return this.remote
        .get(require.toUrl('tests/support/index.html'))
        .setFindTimeout(5000)
        .findByCssSelector('.text-muted')
        .getVisibleText()
        .then(function(text) {
          assert.strictEqual(text, 'Project name', 'Failure message');
        });
    }

  });

});
