/**
 * Defines the grammer to use when parsing the template for tokens.
 *
 * @module grammar
 * @requires utils/escape_delimiter
 */
define(function(require, exports, module) {
  "use strict";

  // Utils.
  var escapeDelimiter = require("./utils/escape_delimiter");

  // Support.
  require("./support/array/map");
  require("./support/array/some");

  /**
   * Represents a Grammar.
   *
   * @class
   * @memberOf module:grammar
   * @param {object} delimiters - Delimiters to use store and use internally.
   */
  function Grammar(delimiters) {
    this.delimiters = delimiters;

    this.internal = [
      makeEntry("START_IF", "if"),
      makeEntry("ELSE", "else"),
      makeEntry("ELSIF", "elsif"),
      makeEntry("END_IF", "endif"),
      makeEntry("NOT", "not"),
      makeEntry("EQUALITY", "=="),
      makeEntry("NOT_EQUALITY", "!="),
      makeEntry("GREATER_THAN_EQUAL", ">="),
      makeEntry("GREATER_THAN", ">"),
      makeEntry("LESS_THAN_EQUAL", "<="),
      makeEntry("LESS_THAN", "<"),
      makeEntry("START_EACH", "each"),
      makeEntry("END_EACH", "endeach"),
      makeEntry("ASSIGN", "as"),
      makeEntry("PARTIAL", "partial"),
      makeEntry("START_EXTEND", "extend"),
      makeEntry("END_EXTEND", "endextend"),
      makeEntry("MAGIC", ".")
    ];
  }

  /**
   * Abstract the logic for adding items to the grammar.
   *
   * @private
   * @param {string} name - Required to identify the match.
   * @param {string} value - To be escaped and used within a RegExp.
   * @returns {object} The normalized metadata.
   */
  function makeEntry(name, value) {
    var escaped = escapeDelimiter(value);

    return {
      name: name,
      escaped: escaped,
      test: new RegExp("^" + escaped)
    };
  }

  /**
   * Escape the stored delimiters.
   *
   * @memberOf module:grammar.Grammar
   * @returns {array} Metadata describing the grammar.
   */
  Grammar.prototype.escape = function() {
    // Order matters here.
    var grammar = [
      "START_RAW",
      "START_PROP",
      "START_EXPR",
      "END_RAW",
      "END_PROP",
      "END_EXPR",
      "COMMENT",
      "FILTER"
    ];

    // Add all normalized delimiters into the grammar.
    grammar = grammar.map(function(key) {
      return makeEntry(key, this.delimiters[key]);
    }, this);

    // Add all normalized internals into the grammar.
    grammar.push.apply(grammar, this.internal);

    // Take the current grammar and craft the remaining valid string values.
    var string = grammar.map(function(value) {
      return value.escaped;
    }).join("|");

    // Add whitespace to grammar.
    grammar.push({
      name: "WHITESPACE",
      test: /^[\ \t\r\n]+/
    });

    // Add whitespace to the whitelist.
    string += "| |\t|\r|\n";

    // The everything-else bucket.
    grammar.push({
      name: "OTHER",
      test: new RegExp("^((?!" + string + ").)*")
    });

    return grammar;
  };

  module.exports = Grammar;
});
