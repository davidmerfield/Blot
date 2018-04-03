/**
 * Legacy support for browsers that don't support String.prototype.trim.
 *
 * @module: support/string/trim
 */
define(function(require, exports, module) {
  "use strict";

  // This polyfill isn't necessary.
  if (String.prototype.trim) {
    return trim;
  }

  /**
   * A polyfill for String#trim.  Modified from MDN.
   *
   * @memberOf module:support/string/trim
   * @returns {string} The trimmed String.
   */
  function trim() {
    return this.replace(/^\s+|\s+$/g, "");
  }

  module.exports = String.prototype.trim = trim;
});
