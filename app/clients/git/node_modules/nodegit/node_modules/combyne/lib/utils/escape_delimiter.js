/**
 * Safely escapes Strings to be used as delimiters via RegExp.
 *
 * @module utils/escape_delimiter
 */
define(function(require, exports, module) {
  "use strict";

  var specialCharsExp = /[\^$\\\/.*+?()\[\]{}|]/g;

  /**
   * Escape special characters that may interfere with RegExp building.
   *
   * @memberOf module:utils/escape_delimiter
   * @param {String} delimiter - The value to escape.
   * @returns {String} A safe value for RegExp building.
   */
  function escapeDelimiter(delimiter) {
    return delimiter.replace(specialCharsExp,"\\$&");
  }

  module.exports = escapeDelimiter;
});
