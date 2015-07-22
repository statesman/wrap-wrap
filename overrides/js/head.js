if( typeof window.plate !== 'undefined' ) {
  // Store the premium value for later so we can use it to override the
  // value set later in the body
  plate._premium = plate.premium;

  plate.togglePremium = function( authorized ){
    if( authorized || !plate.premium ) {
      cmg.query('body').removeClass('roadblocked');
      cmg.query('#flatpage_frame').remove();
    } else{
      cmg.query('body').addClass('roadblocked');
      cmg.query('#flatpage_frame, .janusNotAuthorized').fadeIn();
    }
  };
}
