define([
  'require',
  'intern/dojo/Promise',
  'intern/dojo/node!fs'
], function(require, Promise, fs) {

  /**
   * A page object that allows us to simulate a user
   * consuming content on one of our sites
   *
   * @constructor
   * @param {Command} remote - a Leadfoot Command instance
   * @return {Command} - our modified Leadfoot Command instance
   */
  function Page(remote) {
    this.remote = remote;

    // Defaults
    this._premium = true;
    this._pageviews = 1;
  }

  Page.prototype.constructor = Page;

  /**
   * Set the page's premium status
   *
   * @param {boolean} premium - whether the content is premium
   * @return {Command} - our Leadfoot Command instance
   */
  Page.prototype.setPremium = function(premium) {
    this._premium = (premium === true);
    return this;
  };

  /**
   * Return a page we can run assertions on
   *
   * @return {Command} - a Leadfoot command instance for our current
   *   page
   */
  Page.prototype.getPage = function() {
    return this.remote.get(this._getPath(this._pageviews));
  };

  /**
   * Simulate pageviews
   *
   * @param {number} n - how many pageviews to simulate
   * @return {Command} - our Leadfoot Command instance, focused on
   *   the nth + 1 URL page; for example, if you were to pass in 1
   *   we'd simulate one page view and return you the second page;
   *   you still need to call .getPage() to resolve it
   */
  Page.prototype.doPageviews = function(n) {
    var targetPage = this._pageviews + n;

    while(this._pageviews < targetPage) {
      this.remote.get(this._getPath(this._pageviews)).sleep(10000);
      this._pageviews++;
    }

    return this;
  };

  /**
   * Reset the pageview counter and all browser session data; should
   *   be run in afterEach
   */
  Page.prototype.reset = function() {
    this._premium = true;
    this._pageviews = 1;

    var self = this;

    var deferred = new Promise.Deferred();

    Promise.all([
      this.remote.clearLocalStorage(),
      this.remote.clearSessionStorage(),
      this.remote.clearCookies()
    ]).then(function() {
      self.remote.refresh().then(function() {
        deferred.resolve(true);
      });
    });

    return deferred.promise;
  };

  /**
   * Check that there aren't any modals visible
   *
   * @param {Command} currentPage - a Command instance for a page;
   *   should be what's returned from our .getPage() method
   * @return {Promise} - a promise that resolves to a boolean
   *   indicating whether all of the modals are hidden
   */
  Page.prototype.noModals = function(currentPage) {
    var welcomeVisible = currentPage
      .setFindTimeout(5000)
      .findById('pq-passage-quota-welcome')
      .isDisplayed()
      .promise;

    var upsellVisible = currentPage
      .setFindTimeout(5000)
      .findById('pq-passage-quota-sticky')
      .isDisplayed()
      .promise;

    var roadblockVisible = currentPage
      .setFindTimeout(5000)
      .findById('pq-passage-quota-block')
      .isDisplayed()
      .promise;

    var janrainVisible = currentPage
      .setFindTimeout(5000)
      .findById('janrainModal')
      .isDisplayed()
      .promise;

    return Promise.all([
      welcomeVisible,
      upsellVisible,
      roadblockVisible,
      //janrainVisible
    ]).then(function(results){
      return results[0] === results[1] === results[2] === false;
    });
  };


  Page.prototype.login = function(loginButton) {
    var creds = JSON.parse(fs.readFileSync('secrets.json').toString());

    var self = this;

    return this.getPage()
      .setFindTimeout(5000)
      .findByCssSelector(loginButton)
        .click()
        .end()
      .setFindTimeout(5000)
      .findDisplayedById('capture_signIn_traditionalSignIn_emailAddress')
        .click()
        .type(creds.login.username)
        .end()
      .findById('capture_signIn_traditionalSignIn_password')
        .click()
        .type(creds.login.password)
        .end()
      .findById('capture_signIn_traditionalSignIn_signInButton')
        .click()
        .end()
      .sleep(10000)
      .then(function() {
        return self.noModals(self.remote);
      });
  };

  /**
   * Return a path to the appropriate test file
   *
   * @param {number} n - which pageview to get the URL for
   * @return {string} - the path to our file in the tests support
   *   directory
   */
  Page.prototype._getPath = function(n) {
    var dir = this._premium ? 'premium' : 'free';
    return 'http://local-dev.mystatesman.com:3001/' + dir + '/' + n + '/';
  };

  return Page;

});
