/**
 * Legacy support for browsers that don't support Array.prototype.is_array.
 *
 * @module: support/array/is_array
 */
define(function(require, exports, module) {
  "use strict";

  // Utils.
  var type = require("../../utils/type");

  // This polyfill isn't necessary.
  if (Array.isArray) {
    return isArray;
  }

  /**
   * A polyfill for Array.isArray.  Modified from MDN.
   *
   * @memberOf module:support/array/is_array
   * @param {*} arg - A value to test.
   * @returns {boolean} Whether or not the arg is an Array.
   */
  function isArray(arg) {
    return type(arg) === "[object Array]";
  }

  module.exports = Array.isArray = isArray;
});
