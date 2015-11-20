define([
  'require',
  'intern/dojo/Promise'
], function(require, Promise) {

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
   *   be run in beforeEach
   */
  Page.prototype.reset = function() {
    this._premium = true;
    this._pageviews = 1;

    return this.remote
      .clearCookies()
      .clearLocalStorage()
      .clearSessionStorage();
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

    return Promise.all([
      welcomeVisible,
      upsellVisible,
      roadblockVisible
    ]).then(function(results){
      return results[0] === results[1] === results[2] === false;
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
    return 'http://localhost:3001/' + dir + '/' + n + '/';
  };

  return Page;

});
