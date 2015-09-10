if(typeof window.plate !== 'undefined' && typeof wrap !== 'undefined' && wrap.hasOwnProperty('premium')) {
  if(wrap.premium === false) {
    window.plate.premium = wrap.premium;
  }
}