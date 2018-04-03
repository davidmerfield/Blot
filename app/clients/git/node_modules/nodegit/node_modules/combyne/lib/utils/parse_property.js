/**
 * Determines if a given value is a literal type or context property.
 *
 * @module utils/parse_property
 */
define(function(require, exports, module) {
  "use strict";

  var isString = /['"]+/;

  /**
   * Used to produce the object representing the type.
   *
   * @memberOf module:utils/is_literal
   * @param {String} value - The extracted property to inspect.
   * @returns {Object} A property descriptor.
   */
  function parseProperty(value) {
    var retVal = {
      type: "Property",
      value: value
    };

    if (value === "false" || value === "true") {
      retVal.type = "Literal";
    }
    // Easy way to determine if the value is NaN or not.
    else if (Number(value) === Number(value)) {
      retVal.type = "Literal";
    }
    else if (isString.test(value)) {
      retVal.type = "Literal";
    }

    return retVal;
  }

  module.exports = parseProperty;
});
