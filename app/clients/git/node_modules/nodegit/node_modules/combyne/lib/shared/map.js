/**
 * Iterates various JavaScript types.
 *
 * @module utils/map
 * @requires utils/type
 * @requires utils/create_object
 */
define(function(require, exports, module) {
  "use strict";

  // Utils.
  var type = require("../utils/type");
  var createObject = require("../utils/create_object");

  // Support.
  require("../support/array/is_array");

  /**
   * Allows iteration of an Array, Arguments, NodeList, or plain Object.
   *
   * @memberOf module:utils/map
   * @param {*} obj - Object or Array to iterate.
   * @param {String} index - An identifier name for index.
   * @param {String} value - An identifier name for value.
   * @param {object} data - Data from parent scope.
   * @param {Function} iterator - Function that is called within the template.
   * @returns {Array} String output to be joined.
   */
  function map(obj, index, value, data, iterator) {
    var isArrayLike = type(obj) === "arguments" || type(obj) === "nodelist";
    var isArray = Array.isArray(obj) || isArrayLike;
    var output = [];
    var dataObject;

    // Iteration branch if Array.
    if (isArray) {
      // Make a clone of the Array to operate on, also potentially coercing.
      obj = [].slice.call(obj);

      for (var i = 0; i < obj.length; i++) {
        // Create a new scoped data object.
        dataObject = createObject(data);
        dataObject[index] = i;

        if (value) {
          dataObject[value] = obj[i];
        }
        // If no value was supplied, use this object to key off of.
        else {
          dataObject = obj[i];
        }

        // Add return value of iterator function to output.
        output.push(iterator(dataObject));
      }

      return output;
    }
    // Iteration branch if Object.
    else {
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) {
          continue;
        }

        // Create a new scoped data object.
        dataObject = createObject(data);
        dataObject[index] = key;

        if (value) {
          dataObject[value] = obj[key];
        }
        // If no value was supplied, use this object to key off of.
        else {
          dataObject = obj[key];
        }

        // Add return value of iterator function to output.
        output.push(iterator(dataObject));
      }

      return output;
    }
  }

  module.exports = map;
});
