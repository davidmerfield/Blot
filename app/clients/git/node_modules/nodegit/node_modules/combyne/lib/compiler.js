/**
 * Compiles a template Tree into JavaScript.
 *
 * @module compiler
 * @requires shared/register_partial
 * @requires shared/register_filter
 * @requires shared/get_partial
 * @requires shared/get_filter
 * @requires shared/map
 * @requires shared/encode
 * @requires utils/type
 * @requires utils/create_object
 */
define(function(require, exports, module) {
  "use strict";

  // Shared.
  var registerPartial = require("./shared/register_partial");
  var registerFilter = require("./shared/register_filter");
  var getPartial = require("./shared/get_partial");
  var getFilter = require("./shared/get_filter");
  var map = require("./shared/map");
  var encode = require("./shared/encode");

  // Utils.
  var type = require("./utils/type");
  var createObject = require("./utils/create_object");

  // Support.
  require("./support/array/map");
  require("./support/array/reduce");

  // Borrowed from Underscore.js template function.
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // Borrowed from Underscore.js template function.
  var escapes = {
    "'": "'",
    "\\": "\\",
    "\r": "r",
    "\n": "n",
    "\t": "t",
    "\u2028": "u2028",
    "\u2029": "u2029"
  };

  /**
   * Escapes passed values.
   *
   * @private
   * @param {string} value - The value to escape.
   * @returns {string} The value escaped.
   */
  function escapeValue(value) {
    return value.replace(escaper, function(match) {
      return "\\" + escapes[match];
    });
  }

  /**
   * Normalizes properties in the identifier to be looked up via hash-style
   * instead of dot-notation.
   *
   * @private
   * @param {string} identifier - The identifier to normalize.
   * @returns {string} The identifier normalized.
   */
  function normalizeIdentifier(identifier) {
    if (identifier === ".") {
      // '.' might be referencing either the root or a locally scoped variable
      // called '.'. So try for the locally scoped variable first and then
      // default to the root
      return "(data['.'] || data)";
    }

    return "data" + identifier.split(".").map(function(property) {
      return property ? "['" + property + "']" : "";
    }).join("");
  }

  /**
   * Represents a Compiler.
   *
   * @class
   * @memberOf module:compiler
   * @param {Tree} tree - A template [Tree]{@link module:tree.Tree} to compile.
   */
  function Compiler(tree) {
    this.tree = tree;
    this.string = "";

    // Optimization pass will flatten large templates to result in faster
    // rendering.
    var nodes = this.optimize(this.tree.nodes);
    var compiledSource = this.process(nodes);

    // The compiled function body.
    var body = [];

    // If there is a function, concatenate it to the default empty value.
    if (compiledSource) {
      compiledSource = " + " + compiledSource;
    }

    // Include map and its dependencies.
    if (compiledSource.indexOf("map(") > -1) {
      body.push(createObject, type, map);
    }

    // Include encode and its dependencies.
    if (compiledSource.indexOf("encode(") > -1) {
      body.push(type, encode);
    }

    // The compiled function body.
    body = body.concat([
      // Return the evaluated contents.
      "return ''" + compiledSource
    ]).join(";\n");

    // Create the JavaScript function from the source code.
    this.func = new Function("data", "template", body);

    // toString the function to get its raw source and expose.
    this.source = [
      "{",
        "_partials: {},",
        "_filters: {},",
        "getPartial: " + getPartial + ",",
        "getFilter: " + getFilter + ",",
        "registerPartial: " + registerPartial + ",",
        "registerFilter: " + registerFilter + ",",
        "render: function(data) {",
          "return " + this.func + "(data, this)",
        "}",
      "}"
    ].join("\n");
  }

  /**
   * Takes a pass over the full token set to optimize and eliminate potential
   * bugs associated with super large templates.
   *
   * @memberOf module:compiler.Compiler
   * @param {array} nodes
   * @return {array} optimized nodes
   */
  Compiler.prototype.optimize = function(nodes) {
    return nodes.reduce(function(memo, node) {
      var previous = memo[memo.length - 1];

      // Optimize text nodes together.
      if (previous && previous.type === "Text" && node.type === "Text") {
        previous.value += node.value;
      }

      // This is the first item
      else {
        memo.push(node);
      }

      return memo;
    }, []);
  };

  /**
   * A recursively called method to detect how to compile each Node in the
   * Tree.
   *
   * @memberOf module:compiler.Compiler
   * @param {array} nodes - An Array of Tree nodes to process.
   * @param {array} keyVal - An optional array of meta condition keys.
   * @return {string} Joined compiled nodes representing the template body.
   */
  Compiler.prototype.process = function(nodes, keyVal) {
    var commands = [];

    // Parse the Tree and execute the respective compile to JavaScript method.
    nodes.map(function(node, index) {
      switch (node.type) {
        case "RawProperty":
          commands.push(this.compileProperty(node, false));
          break;

        case "Property":
          commands.push(this.compileProperty(node, true));
          break;

        case "ConditionalExpression":
          commands.push(this.compileConditional(node));
          break;

        case "LoopExpression":
          commands.push(this.compileLoop(node));
          break;

        case "PartialExpression":
          commands.push(this.compilePartial(node));
          break;

        case "ExtendExpression":
          commands.push(this.compileExtend(node));
          break;

        default:
          // Ensure a node always has a value.
          if (node.value) {
            commands.push("'" + escapeValue(node.value) + "'");
          }
          break;
      }
    }, this);

    return commands.join("+");
  };

  /**
   * Compiles a property into JavaScript.
   *
   * @memberOf module:compiler.Compiler
   * @param {object} node - The property node to compile.
   * @param {boolean} encode - Whether or not to encode the property.
   * @return {string} The compiled JavaScript source string value.
   */
  Compiler.prototype.compileProperty = function(node, encode) {
    var identifier = node.value;

    // Normalize string property values that contain single or double quotes.
    if (identifier.indexOf("'") === -1 && identifier.indexOf("\"") === -1) {
      identifier = normalizeIdentifier(node.value);
    }

    // Normalize the incoming arguments to either their literal value or data
    // lookup.
    var normalizeArgs = node.args.map(function(arg) {
      var value = arg.value;
      return arg.type === "Literal" ? value : normalizeIdentifier(value);
    });

    // Build the initial identifier value check.
    var value = [
      "(",
        // If the identifier is a function, then invoke, otherwise return
        // identifier.
        "typeof", identifier, "===", "'function'",
          "?", encode ? "encode(" + identifier + "(" + normalizeArgs + "))" :
            identifier + "(" + normalizeArgs + ")",
          ":", encode ? "encode(" + identifier + ") == null ? '' : encode(" +
            identifier + ")" : identifier + " == null ? '' : " + identifier,
      ")"
    ].join(" ");

    // Find any filters and nest them.
    value = node.filters.reduce(function(memo, filter) {
      var args = filter.args.length ? ", " + filter.args.map(function(arg) {
        var value = arg.value;

        // If not a string, normalize.
        if (value.indexOf("'") === -1 && value.indexOf("\"") === -1) {
          // Not a number.
          if (Number(value) !== Number(value)) {
            // Not a boolean.
            if (value !== "true" && value !== "false") {
              return normalizeIdentifier(value);
            }
          }
        }

        return value;
      }).join(", ") : "";

      return "template.getFilter('" + filter.value + "')" + "(" + memo + args +
        ")";
    }, value);

    return value;
  };

  /**
   * Compiles a conditional into JavaScript.
   *
   * @memberOf module:compiler.Compiler
   * @param {object} node - The conditional node to compile.
   * @return {string} The compiled JavaScript source string value.
   */
  Compiler.prototype.compileConditional = function(node) {
    if (node.conditions.length === 0) {
      throw new Error("Missing conditions to if statement");
    }

    var _this = this;

    var condition = node.conditions.map(function(condition) {
      switch (condition.type) {
        case "Identifier":
          return _this.compileProperty(
            condition.value,
            condition.value.type == "Property");

        case "Not":
          return "!";

        case "Literal":
          return condition.value;

        case "Equality":
          return condition.value;
      }
    }).join("");

    // If an else was provided, hook into it.
    var els = node.els ? this.process(node.els.nodes) : null;

    // If an elsif was provided, hook into it.
    var elsif = node.elsif ? this.compileConditional(node.elsif) : null;

    return [
      "(", "(", condition, ")", "?", this.process(node.nodes) || "''", ":",

      els || elsif || "''",

      ")"
    ].join("");
  };

  /**
   * Compiles a loop into JavaScript.
   *
   * @memberOf module:compiler.Compiler
   * @param {object} node - The loop node to compile.
   * @return {string} The compiled JavaScript source string value.
   */
  Compiler.prototype.compileLoop = function(node) {
    var conditions = node.conditions;

    var keyVal = [
      // Key
      (conditions[3] ? conditions[3].value : "i"),

      // Value.
      (conditions[2] ? conditions[2].value : ".")
    ];

    // Normalize the value to the condition if it exists.
    var value = conditions.length && conditions[0].value;

    // Construct the loop, utilizing map because it will return back the
    // template as an array and ready to join into the template.
    var loop = [
      "map(",
        value ? this.compileProperty(value, value.type == "Property") : "data",
        ",",

        // Index keyword.
        "'", keyVal[0], "'", ",",

        // Value keyword.
        "'", value ? keyVal[1] : "", "'", ",",

        // Outer scope data object.
        "data", ",",

        // The iterator function.
        "function(data) {",
          "return " + this.process(node.nodes, keyVal),
        "}",
      ").join('')"
    ].join("");

    return loop;
  };

  /**
   * Compiles a partial into JavaScript.
   *
   * @memberOf module:compiler.Compiler
   * @param {object} node - The partial node to compile.
   * @return {string} The compiled JavaScript source string value.
   */
  Compiler.prototype.compilePartial = function(node) {
    return [
      "(",
        "template.getPartial('", node.value, "').render(",
          typeof node.data !== "string" ?
            this.compileProperty(node.data, true) : node.data,
        ")",
      ")"
    ].join("");
  };

  /**
   * Compiles a render into JavaScript.
   *
   * @memberOf module:compiler.Compiler
   * @param {object} node - The partial node to compile.
   * @return {string} The compiled JavaScript source string value.
   */
  Compiler.prototype.compileExtend = function(node) {
    return [
      "(",
        // Register this template as the child partial of the parent.
        "template.getPartial('", node.value.template.trim(),
          "').registerPartial", "('", node.value.partial.trim(),
            "', { render: function(_data) {",
            "data = _data || data;",
            "return ", this.process(node.nodes), ";",
          "}, data: data, _filters: {}, _partials: {} }),",
        // Invoke the parent template with the passed data.
        "template.getPartial('", node.value.template.trim(), "').render(data)",
      ")"
    ].join("");
  };

  module.exports = Compiler;
});
