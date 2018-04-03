/**
 * Creates a new object with the [[Proto]] set to a passed in object.
 *
 * @module utils/create_object
 */
define(function(require, exports, module) {
  "use strict";

  /**
   * Basic Crockford-ian style Object.create.  Intentionally named to
   * distinguish from the native implementation.
   *
   * @memberOf module:utils/create_object
   * @param {Object} parent - An object to specify as the return prototype.
   * @returns {object} An object with parent object as the prototype.
   */
  function createObject(parent) {
    function F() {}
    F.prototype = parent;
    return new F();
  }

  module.exports = createObject;
});
