define(function (require) {
  // Load the object test interface
  var registerSuite = require('intern!object');

  // Load the assertion interface
  var assert = require('intern/chai!assert');

  // Load the code to test
  var hello = require('dist/access-meter');

  registerSuite({

    name: 'wrap',

    greet: function() {
      assert.strictEqual(true, true,
        'Description 2');
      assert.strictEqual('Expected', 'Expected',
        'Description');
    }

  });

});
