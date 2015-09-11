if(typeof window.plate !== 'undefined') {
  /**
   * Override the logout handler to reload the window instead of forwarding
   * to mystatesman.com.
   *
   * See window.plate at the top of the wrap to see what this is overriding
   */
  window.plate.logoutSuccessHandler = function(){
      if(window.janrain) {
        janrain.on('cmg_ready', function() {
          var logout = function() {
            /* the alias cookie can only be on root domain, but ur_name+
             ur_uuid can be on root domain or subdomain: carpet bomb */
            ['ur_name', 'ur_uuid', 'alias'].forEach(function(e, i, a){
                document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2);
                document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2) + '; domain=.' + plate.rootDomain();
            });
            document.location.reload();
          };
          janrain.settings.capture.federateLogoutCallback = logout;
          /* the cmLogout handler is defined by janrain, unbind it now */
          cmg.query(document).undelegate('.cmLogout');
          /* then add our own override */
          cmg.query('.cmLogout').on('touchstart click', function(e) {
            logout();
          });
        });
      } else {
        setTimeout(plate.logoutSuccessHandler, 100);
      }
  };
}