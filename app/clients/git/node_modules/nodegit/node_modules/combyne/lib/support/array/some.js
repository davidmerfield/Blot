/**
 * Legacy support for browsers that don't support Array.prototype.some.
 *
 * @module: support/array/some
 */
define(function(require, exports, module) {
  "use strict";

  // This polyfill isn't necessary.
  if (Array.prototype.some) {
    return some;
  }

  /**
   * A polyfill for Array#some.  Modified from MDN.
   *
   * @memberOf module:support/array/some
   * @param {function} iterator - An interator function to call.
   * @param {object} thisArg - An optional context to pass.
   * @returns {boolean} Whether or not the iterator returned truthy.
   */
  function some(iterator, thisArg) {
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

    for (var i = 0; i < array.length; i++) {
      if (i in array) {
        if (iterator.call(thisArg, array[i], i, array)) {
          return true;
        }
      }
    }

    return false;
  }

  module.exports = Array.prototype.some = some;
});
