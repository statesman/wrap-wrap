// Ensure that the premium setting from the
// head overrides the one in the body
if(typeof plate !== 'undefined' && typeof plate._premium !== 'undefined') {
  plate.premium = plate._premium;
}