/**
 * Exposed module for creating and rendering templates.
 *
 * @module index
 * @requires grammar
 * @requires tokenizer
 * @requires tree
 * @requires compiler
 * @requires shared/register_partial
 * @requires shared/register_filter
 * @requires shared/get_partial
 * @requires shared/get_filter
 * @requires utils/type
 */
define(function(require, exports, module) {
  "use strict";

  var Grammar = require("./grammar");
  var Tokenizer = require("./tokenizer");
  var Tree = require("./tree");
  var Compiler = require("./compiler");

  // Shared.
  var registerPartial = require("./shared/register_partial");
  var registerFilter = require("./shared/register_filter");
  var getPartial = require("./shared/get_partial");
  var getFilter = require("./shared/get_filter");

  // Utils.
  var type = require("./utils/type");
  var defaults = require("./utils/defaults");

  // These are the custom delimiters that will always be falled back on for
  // every template.  They can be overwritten in the settings object.
  var defaultDelimiters = {
    START_RAW: "{{{",
    END_RAW: "}}}",
    START_PROP: "{{",
    END_PROP: "}}",
    START_EXPR: "{%",
    END_EXPR: "%}",
    COMMENT: "--",
    FILTER: "|"
  };

  /**
   * Represents a Combyne template.
   *
   * @class Combyne
   * @param {string} template - The template to compile.
   * @param {object} data - Optional data to compile.
   * @memberOf module:index
   */
  function Combyne(template, data) {
    // Allow this method to run standalone.
    if (!(this instanceof Combyne)) {
      return new Combyne(template, data);
    }

    // Expose the template for easier accessing and mutation.
    this.template = template;

    // Default the data to an empty object.
    this.data = data || {};

    // Internal use only.  Stores the partials and filters.
    this._partials = {};
    this._filters = {};

    // Ensure the template is a String.
    if (type(this.template) !== "string") {
      throw new Error("Template must be a String.");
    }

    // Normalize the delimiters with the defaults, to ensure a full object.
    var delimiters = defaults(Combyne.settings.delimiters, defaultDelimiters);

    // Create a new grammar with the delimiters.
    var grammar = new Grammar(delimiters).escape();

    // Break down the template into a series of tokens.
    var stack = new Tokenizer(this.template, grammar).parse();

    // Take the stack and create something resembling an AST.
    var tree = new Tree(stack).make();

    // Expose the internal tree and stack.
    this.tree = tree;
    this.stack = stack;

    // Compile the template function from the tree.
    this.compiler = new Compiler(tree);

    // Update the source.
    this.source = this.compiler.source;
  }

  /**
   * Register a partial into the template.
   *
   * @memberOf module:index.Combyne
   * @see {@link module:shared/register_partial}
   */
  Combyne.prototype.registerPartial = registerPartial;

  /**
   * Register a filter into the template.
   *
   * @memberOf module:index.Combyne
   * @see {@link module:shared/register_filter}
   */
  Combyne.prototype.registerFilter = registerFilter;

  /**
   * Get a partial from the template.
   *
   * @memberOf module:index.Combyne
   * @see {@link module:shared/get_partial}
   */
  Combyne.prototype.getPartial = getPartial;

  /**
   * Get a filter from the template.
   *
   * @memberOf module:index.Combyne
   * @see {@link module:shared/get_filter}
   */
  Combyne.prototype.getFilter = getFilter;

  /**
   * Expose the global template settings.
   *
   * @memberOf module:index.Combyne
   * @type {object}
   */
  Combyne.settings = {};

  /**
   * Render the template with data.
   *
   * @memberOf module:index.Combyne
   * @param {object} data - The data to provide to the template.
   * @return {string} Rendered template.
   */
  Combyne.prototype.render = function(data) {
    // Override the template data if provided.
    this.data = data || this.data;

    // Execute the template function with the correct data.
    return this.compiler.func(this.data, this);
  };

  /**
   * Attach the version number.
   *
   * @memberOf module:index.Combyne
   * @type {string}
   */
  Combyne.VERSION = "0.8.1";

  module.exports = Combyne;
});
