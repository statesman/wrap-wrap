define(function(require) {

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
      this.remote.get(this._getPath(this._pageviews));
      this._pageviews++;
    }

    return this;
  };

  /**
   * Reset the pageview counter; should be run in beforeEach
   */
  Page.prototype.reset = function() {
    this._premium = true;
    this._pageviews = 1;
  };

  /**
   * Return a path to the appropriate test file
   *
   * @param {number} n - which pageview to get the URL for
   * @return {string} - the path to our file in the tests support
   *   directory
   */
  Page.prototype._getPath = function(n) {
    var dir = this._premium ? 'premiumtest' : 'freetest';
    return require.toUrl('tests/support/' + dir + '/' + n + '.html');
  };

  return Page;

});
