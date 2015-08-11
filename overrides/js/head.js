if( typeof window.plate !== 'undefined' ) {
  // Store the premium value for later so we can use it to override the
  // value set later in the body
  plate._premium = plate.premium;

  // Override the togglePremium handler to better align with our
  // markup, styles
  plate.togglePremium = function( authorized ){
    if( authorized ) {
      cmg.query('body').addClass('cmg-authed');
    }
    else {
      cmg.query('body').removeClass('cmg-authed');
    }
    if( authorized || !plate.premium ) {
      cmg.query('body').removeClass('roadblocked');
      cmg.query('.invitation_chunk, .janusNotAuthorized').hide();
      //cmg.query('#flatpage_frame').remove();
    } else{
      cmg.query('body').addClass('roadblocked');
      cmg.query('.invitation_chunk, .janusNotAuthorized').show();
      //cmg.query('#flatpage_frame, .janusNotAuthorized').fadeIn();
    }
  };

  // Override the logout handler so it doesn't bounce to MyStatesman.com
  plate.logoutSuccessHandler = function(){
    if(janrain === undefined){
      setTimeout(plate.logoutSuccessHandler, 100);
    }
    else{
      janrain.on('cmg_ready', function(){
        // This logout handler is the only thing we're really overriding
        var logout = function(){
          /* the alias cookie can only be on root domain, but ur_name+
           ur_uuid can be on root domain or subdomain: carpet bomb */
          ['ur_name', 'ur_uuid', 'alias'].forEach(function(e, i, a){
              document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2);
              document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2) + '; domain=.' + plate.rootDomain();
          });
          document.location.reload();
        };
        janrain.settings.capture.federateLogoutCallback = logout;
        // Unbind the old logout handler
        cmg.query(document).undelegate('.cmLogout');
        // Replace it with our custom one
        cmg.query('.cmLogout').on('touchstart click', function(e){
          logout();
        });
      });
    }
  };
}
