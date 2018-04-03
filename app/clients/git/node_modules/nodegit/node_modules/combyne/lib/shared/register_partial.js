/**
 * Registers partials on a template.
 *
 * @module shared/register_partial
 */
define(function(require, exports, module) {
  "use strict";

  /**
   * Registers a partial on the template object.
   *
   * @memberOf module:shared/register_partial
   * @param {string} partialName - The name to register.
   * @param {function} template - The template to use as a partial.
   */
  function registerPartial(partialName, template) {
    this._partials[partialName] = template;

    // Register the parent as this top-level template. Used to share filters
    // and partials.
    template._parent = this;
  }

  module.exports = registerPartial;
});
