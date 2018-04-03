/**
 * Retrieves partial functions from within a template.
 *
 * @module shared/get_partial
 */
define(function(require, exports, module) {
  "use strict";

  /**
   * Retrieves a partial locally registered, or via the parent.
   *
   * @memberOf module:shared/get_partial
   * @param {string} name - The name of the partial to retrieve.
   */
  function getPartial(name) {
    if (name in this._partials) {
      return this._partials[name];
    }
    else if (this._parent) {
      return this._parent.getPartial(name);
    }

    throw new Error("Missing partial " + name);
  }

  module.exports = getPartial;
});
