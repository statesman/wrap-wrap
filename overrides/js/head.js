if( typeof window.plate !== 'undefined' ) {
  window.plate.togglePremium = function( authorized ){
    if( authorized || !plate.premium ) {
      cmg.query('#flatpage_frame, .janusNotAuthorized').hide();
      cmg.query('.premium-content').removeClass('premium-content');
    } else{
      cmg.query('#flatpage_frame, .janusNotAuthorized').show();
    }
  };
}