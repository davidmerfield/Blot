/**
 * Merges default target object into source.
 *
 * @module utils/defaults
 */
define(function(require, exports, module) {
  "use strict";

  /**
   * Merge all default properties into target.
   *
   * @memberOf module:utils/defaults
   * @param {object} target - The object to merge into.
   * @param {object} source - The defaults object that will be merged.
   * @returns {object} The target object.
   */
  function defaults(target, source) {
    // Ensure target and source are always objects.
    target = target || {};
    source = source;

    for (var key in source) {
      if (!source.hasOwnProperty(key)) {
        continue;
      }

      // Ensure the key isn't present, before merging.
      if (!(key in target)) {
        target[key] = source[key];
      }
    }

    return target;
  }

  module.exports = defaults;
});
