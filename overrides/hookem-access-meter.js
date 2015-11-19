if(typeof window.plate !== 'undefined' && typeof wrap !== 'undefined' && wrap.hasOwnProperty('premium')) {
  /**
   * Use our own wrap object to set the premium status on pages
   */
  window.plate.premium = wrap.premium;
}
