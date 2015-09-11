if(typeof window.plate !== 'undefined' && typeof wrap !== 'undefined' && wrap.hasOwnProperty('premium')) {
  /**
   * Use our own wrap object to set the premium status on pages
   */
  if(wrap.premium === false) {
    window.plate.premium = wrap.premium;
  }
}