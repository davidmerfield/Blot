/**
 * Registers filter functions on a template.
 *
 * @module shared/register_filter
 */
define(function(require, exports, module) {
  "use strict";

  /**
   * Registers a filter on the template object.
   *
   * @memberOf module:shared/register_filter
   * @param {string} name - The name to register.
   * @param {function} callback - The callback to trigger for the filter.
   */
  function registerFilter(name, callback) {
    this._filters[name] = callback;
  }

  module.exports = registerFilter;
});
