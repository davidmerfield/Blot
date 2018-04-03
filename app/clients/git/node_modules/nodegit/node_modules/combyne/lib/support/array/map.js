/**
 * Legacy support for browsers that don't support Array.prototype.map.
 *
 * @module: support/array/map
 */
define(function(require, exports, module) {
  "use strict";

  // This polyfill isn't necessary.
  if (Array.prototype.map) {
    return map;
  }

  /**
   * A polyfill for Array#map.  Modified from MDN.
   *
   * @memberOf module:support/array/map
   * @param {function} iterator - An interator function to call.
   * @param {object} thisArg - An optional context to pass.
   * @returns {array} The return values from the iterator function.
   */
  function map(iterator, thisArg) {
    // Ensure called with a valid context.
    if (this == null) {
      throw new TypeError();
    }

    // Ensure a function was passed as the iterator.
    if (typeof iterator !== "function") {
      throw new TypeError();
    }

    // Ensure there is always a `thisArg`.
    thisArg = thisArg || this;

    // Coerce this value to an Array.
    var array = Array.prototype.slice.call(this);

    // Cache the return values.
    var retVal = [];

    for (var i = 0; i < array.length; i++) {
      if (i in array) {
        retVal[retVal.length] = iterator.call(thisArg, array[i], i, array);
      }
    }

    return retVal;
  }

  module.exports = Array.prototype.map = map;
});
