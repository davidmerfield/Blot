/**
 * Encodes strings to make user input safer.
 *
 * @module shared/encode
 * @requires module:utils/type
 */
define(function(require, exports, module) {
  "use strict";

  // Utils.
  var type = require("../utils/type");

  /**
   * Encodes a String with HTML entities.
   *
   * Solution adapted from:
   * http://stackoverflow.com/questions/18749591
   *
   * @memberOf module:shared/encode
   * @param {*} raw - The raw value to encode, identity if not a String.
   * @returns {string} An encoded string with HTML entities.
   */
  function encode(raw) {
    if (type(raw) !== "string") {
      return raw;
    }

    // Identifies all characters in the unicode range: 00A0-9999, ampersands,
    // greater & less than) with their respective html entity.
    return raw.replace(/["&'<>`]/g, function(match) {
       return "&#" + match.charCodeAt(0) + ";";
    });
  }

  module.exports = encode;
});
