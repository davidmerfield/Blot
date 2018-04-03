/**
 * Retrieves filter functions from within a template.
 *
 * @module shared/get_filter
 */
define(function(require, exports, module) {
  "use strict";

  /**
   * Retrieves a filter locally registered, or via the parent.
   *
   * @memberOf module:shared/get_filter
   * @param {string} name - The name of the filter to retrieve.
   */
  function getFilter(name) {
    if (name in this._filters) {
      return this._filters[name];
    }
    else if (this._parent) {
      return this._parent.getFilter(name);
    }

    throw new Error("Missing filter " + name);
  }

  module.exports = getFilter;
});
