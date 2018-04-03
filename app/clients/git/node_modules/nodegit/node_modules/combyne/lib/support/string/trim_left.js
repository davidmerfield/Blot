/**
 * Legacy support for browsers that don't support String.prototype.trimLeft.
 *
 * @module: support/string/trim_left
 */
define(function(require, exports, module) {
  "use strict";

  // This polyfill isn't necessary.
  if (String.prototype.trimLeft) {
    return trimLeft;
  }

  /**
   * A polyfill for String#trimLeft.  Modified from MDN.
   *
   * @memberOf module:support/string/trim_left
   * @returns {string} The trimmed String.
   */
  function trimLeft() {
    return this.replace(/^\s+/, "");
  }

  module.exports = String.prototype.trimLeft = trimLeft;
});
