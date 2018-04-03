/**
 * Legacy support for browsers that don't support Array.prototype.reduce.
 *
 * @module: support/array/reduce
 */
define(function(require, exports, module) {
  "use strict";

  // This polyfill isn't necessary.
  if (Array.prototype.reduce) {
    return reduce;
  }

  /**
   * A polyfill for Array#reduce.  Modified from MDN.
   *
   * @memberOf module:support/array/reduce
   * @param {function} iterator - An interator function to call.
   * @param {object} memo - A reference object to use as memo.
   * @returns {object} The memoized object.
   */
  function reduce(iterator, memo) {
    // Ensure called with a valid context.
    if (this == null) {
      throw new TypeError();
    }

    // Ensure a function was passed as the iterator.
    if (typeof iterator !== "function") {
      throw new TypeError();
    }

    // Coerce this value to an Array.
    var array = Array.prototype.slice.call(this);

    for (var i = 0; i < array.length; i++) {
      if (i in array) {
        memo = iterator(memo, array[i], i, array);
      }
    }

    return memo;
  }

  module.exports = Array.prototype.reduce = reduce;
});
