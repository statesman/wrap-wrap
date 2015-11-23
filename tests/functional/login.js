define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!fs',
  '../support/pages/page'
], function(registerSuite, assert, fs, Page) {

  registerSuite(function() {

    var page;

    return {

      name: 'login',

      setup: function() {
        page = new Page(this.remote);
      },

      afterEach: function() {
        return page.reset();
      },

      '.cmOpenJanrainModal login button': function() {
        return page
          .setPremium(false)
          .getPage()
          .setFindTimeout(5000)
          .findById('login-button')
            .click()
            .end()
          .takeScreenshot()
            .then(function (data) {
              fs.writeFileSync('tests/screenshots/login.png', data);
            })
          .findById('janrainModal')
            .isDisplayed()
            .then(function(visible) {
              assert.isTrue(visible,
                'Clicking a button with the .cmOpenJanrainModal class opens the login box.');
            })
            .end();
      },

      'login works from custom button': function() {
        return page
          .setPremium(false)
          .login('#login-button')
          .then(function(noModals) {
            assert.isTrue(noModals,
              'Clicking a button with the .cmOpenJanrainModal class and logging in succeeds.');
          });
      },

      'login works from welcome modal': function() {
        return page
          .login('#pq-welcome-signin')
          .then(function(noModals) {
            assert.isTrue(noModals,
              'Clicking the login link on the welcome modal succeeds.');
          });
      },

      'login works from upsell modal': function() {
        return page
          .doPageviews(3)
          .login('#pq-passage-quota-sticky .pq-access-meter-link.cmOpenJanrainModal.pq-modal-subscriber-link')
          .then(function(noModals) {
            assert.isTrue(noModals,
              'Clicking the login link on the upsell modal succeeds.');
          });
      },

      'login works from roadblock modal': function() {
        return page
          .doPageviews(5)
          .login('#pq-passage-quota-block .pq-access-meter-link.cmOpenJanrainModal.pq-modal-subscriber-link')
          .then(function(noModals) {
            assert.isTrue(noModals,
              'Clicking the login link on the roadblock modal succeeds.');
          });
      }

    };

  });

});
