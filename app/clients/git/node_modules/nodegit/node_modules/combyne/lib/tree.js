/**
 * A tree representation of the template tokens.
 *
 * @module tree
 */
define(function(require, exports, module) {
  "use strict";

  // Support.
  require("./support/string/trim");

  var parseProperty = require("./utils/parse_property");

  /**
   * Represents a Tree.
   *
   * @class
   * @memberOf module:tree
   * @param {array} stack - A stack of tokens to parse.
   */
  function Tree(stack) {
    // Internally use a copy of the stack.
    this.stack = stack.slice();

    // The root tree node.
    this.root = {
      type: "Template",
      nodes: []
    };
  }

  /**
   * Takes in an element from the stack of generated tokens.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @param {string} END - Token name to cause an expression to end processing.
   * @return {object} The root element decorated or null to stop.
   */
  Tree.prototype.make = function(root, END) {
    root = root || this.root;

    var node, result, prev, next;
    var index = 0;

    // Pull out the first item in the stack.
    while (this.stack.length) {
      node = this.stack.shift();
      prev = node.previous || {};
      next = this.stack[0] || {};

      switch (node.name) {
        case "START_RAW":
          root.nodes.push(this.constructProperty(false));
          break;

        case "START_PROP":
          root.nodes.push(this.constructProperty(true));
          break;

        case "START_EXPR":
          if (result = this.constructExpression(root, END)) {
            root.nodes.push(result);
            break;
          }

          // Comments return false.
          else if (result !== false) {
            return null;
          }

          break;

        case "END_EXPR":
          break;

        case "WHITESPACE":
          var capture = node.capture[0];
          var idx = capture.indexOf("\n");

          if (prev.name === "END_EXPR") {
            // Whitespace rules only apply when newlines are present, otherwise
            // we assume the whitespace is intentional.
            if (next.name === "START_EXPR" && idx > -1) {
              capture = "";
            }
            else if (idx > -1) {
              capture = capture.slice(idx + 1);
            }
          }
          else if (prev.name && next.name === "START_EXPR" && idx > -1) {
            capture = capture.slice(0, capture.lastIndexOf("\n") + 1);
          }

          root.nodes.push({
            type: "Text",
            value: capture
          });

          break;

        default:
          var prevWhitespace = "";

          prev = root.nodes[root.nodes.length - 1] || {};

          root.nodes.push({
            type: "Text",
            value: prevWhitespace + node.capture[0]
          });

          break;
      }

      ++index;
    }

    return root;
  };

  /**
   * Build a descriptor to describe an instance of a property.
   *
   * @memberOf module:tree.Tree
   * @param {boolean} encoded - Whether or not to encode this property.
   * @return {object} Either a property descriptor or filter pass.
   */
  Tree.prototype.constructProperty = function(encoded) {
    var propertyDescriptor = {
      type: encoded ? "Property" : "RawProperty",
      value: "",
      args: [],
      filters: []
    };

    var previous;
    var input = "";
    var processParsedProperty = function() {
      // Split up the input into space-delimited parts.
      var parts = input.trim().split(" ");

      // The property name.
      propertyDescriptor.value = parts[0];

      // Properties can have arguments passed.
      propertyDescriptor.args = parts.slice(1).map(parseProperty);
    };

    // Keep iterating through the stack until END_PROP is found.
    while (this.stack.length) {
      var node = this.stack.shift();
      var next = this.stack[0] || {};

      // Allow the use of the reserved word `as`.
      if (node.name === "ASSIGN" && next.name !== "WHITESPACE") {
        node.name = "OTHER";
      }

      switch (node.name) {
        case "FILTER":
          propertyDescriptor.value = input.trim();
          return this.constructFilter(propertyDescriptor);

        case "END_EXPR":
        case "EQUALITY":
        case "NOT_EQUALITY":
        case "GREATER_THAN":
        case "GREATER_THAN_EQUAL":
        case "LESS_THAN":
        case "LESS_THAN_EQUAL":
        case "ASSIGN":
          processParsedProperty();

          // This property is embedded in some of expression, so lets stop
          // processing it and put the current token back on top of the stack
          // so whatever expression was working can finish it's processing
          this.stack.unshift(node);

          return propertyDescriptor;

        case "END_RAW":
        case "END_PROP":
        case "END_EXPR":
          processParsedProperty();

          return propertyDescriptor;

        default:
          input += node.capture[0];
          break;
      }

      previous = node;
    }

    throw new Error("Unterminated property.");
  };

  /**
   * Build a descriptor to describe an instance of an extend.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @return {object} The root element decorated.
   */
  Tree.prototype.constructExtend = function(root) {
    root.type = "ExtendExpression";

    // What to return to the compiler.
    var value = {
      template: "",
      partial: ""
    };

    // Start filling the template first.
    var side = "template";

    LOOP:
    while (this.stack.length) {
      var node = this.stack.shift();

      switch (node.name) {
        case "END_EXPR":
          break LOOP;

        case "ASSIGN":
          side = "partial";
          break;

        default:
          // Capture the template and partial values.
          value[side] += node.capture[0];
          break;
      }
    }

    // Trim the template and partial values.
    value.template = value.template.trim();
    value.partial = value.partial.trim();

    // Assign this value.
    root.value = value;

    // If no template, this is an error.
    if (!root.value.template) {
      throw new Error("Missing valid template name.");
    }

    // If no partial, this is an error.
    if (!root.value.partial) {
      throw new Error("Missing valid partial name.");
    }

    this.make(root, "END_EXTEND");

    return root;
  };

  /**
   * Build a descriptor to describe an instance of a partial.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @return {object} The root element decorated.
   */
  Tree.prototype.constructPartial = function(root) {
    root.type = "PartialExpression";

    // By default isolate the partial from the parent's data.
    root.value = "";
    root.data = "null";

    // No node in a partial expression?
    delete root.nodes;

    // Track number of whitespace found.
    var wsCount = 0;

    LOOP:
    while (this.stack.length) {
      var node = this.stack.shift();

      switch (node.name) {
        case "END_EXPR":
          break LOOP;

        default:
          if (node.name === "WHITESPACE") {
            wsCount++;
          }

          if (wsCount === 1) {
            root.value += node.capture[0].trim();
          }
          else {
            root.data = this.constructProperty(true);
          }

          break;
      }
    }

    // If no value, this is an error.
    if (!root.value) {
      throw new Error("Missing valid partials name.");
    }

    return root;
  };

  /**
   * Build a descriptor to describe an instance of a filter.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @return {object} The root element decorated.
   */
  Tree.prototype.constructFilter = function(root) {
    var current = {
      type: "Filter",
      args: []
    };

    var previous;

    // All stringified contents found.
    var input = "";

    LOOP:
    while (this.stack.length) {
      var node = this.stack.shift();
      var next = this.stack[0] || {};

      // Allow the use of the reserved word `as`.
      if (node.name === "ASSIGN" && next.name !== "WHITESPACE") {
        node.name = "OTHER";
      }

      switch (node.name) {
        case "END_EXPR":
        case "EQUALITY":
        case "NOT_EQUALITY":
        case "GREATER_THAN":
        case "GREATER_THAN_EQUAL":
        case "LESS_THAN":
        case "LESS_THAN_EQUAL":
        case "ASSIGN":
          root.filters.push(current);

          // This filter is embedded in some of expression, so lets stop
          // processing it and put the current token back on top of the stack
          // so whatever expression was working can finish it's processing
          this.stack.unshift(node);

          break LOOP;

        case "END_RAW":
        case "END_PROP":
          root.filters.push(current);
          break LOOP;

        // Allow nested filters.
        case "FILTER":
          root.filters.push(current);
          this.constructFilter(root);
          break LOOP;

        // Accumulate all values into the input variable, will split later.
        default:
          input += node.capture[0];
      }

      previous = node;
    }

    // Split up the input into space-delimited parts.
    var parts = input.trim().split(" ");

    // The partial name.
    current.value = parts[0];

    // If no value, this is an error.
    if (!current.value) {
      throw new Error("Missing valid filter name.");
    }

    // Partials have arguments passed.
    current.args = parts.slice(1).map(parseProperty);

    return root;
  };

  /**
   * Build a descriptor to describe an instance of a loop.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @return {object} The root element decorated.
   */
  Tree.prototype.constructEach = function(root) {
    root.type = "LoopExpression";
    root.conditions = [];

    // Find the left side identifier.
    var isLeftSide = true;

    LOOP:
    while (this.stack.length) {
      var node = this.stack.shift();

      switch (node.name) {
        case "ASSIGN":
          isLeftSide = false;

          root.conditions.push({
            type: "Assignment",
            value: node.capture[0].trim()
          });

          break;

        case "END_EXPR":
          break LOOP;

        case "WHITESPACE":
          break;

        default:
          // If we're on the left hand side and there are already conditions,
          // this is the only time we're aren't pushing a value descriptor.
          if (!isLeftSide) {
            root.conditions.push({
              type: "Identifier",
              value: node.capture[0].trim()
            });
          }
          else {
            // This value needs to be processed by constructProperty so put it
            // back on the top of the stack.
            this.stack.unshift(node);

            root.conditions.push({
              type: "Identifier",
              value: this.constructProperty(node.name != "START_RAW")
            });
          }

          break;
      }
    }

    this.make(root, "END_EACH");

    return root;
  };

  /**
   * Build a descriptor to describe an instance of a comment.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @return {object} The root element decorated.
   */
  Tree.prototype.constructComment = function(root) {
    var previous = {};

    while (this.stack.length) {
      var node = this.stack.shift();

      switch (node.name) {
        case "COMMENT":
          if (previous.name === "START_EXPR") {
            this.constructComment(root);
          }

          break;

        case "END_EXPR":
          if (previous.name === "COMMENT") {
            return false;
          }

          break;
      }

      previous = node;
    }

    return false;
  };

  /**
   * Build a descriptor to describe an instance of a conditional.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @param {string} kind - A way to determine else from elsif.
   * @return {object} The root element decorated.
   */
  Tree.prototype.constructConditional = function(root, kind) {
    root.type = root.type || "ConditionalExpression";
    root.conditions = root.conditions || [];

    var prev = {};

    if (kind === "ELSE") {
      root.els = { nodes: [], type: "ConditionalExpression" };
      return this.make(root.els, "END_IF");
    }

    if (kind === "ELSIF") {
      root.elsif = { nodes: [] };
      this.constructConditional(root.elsif, "SKIP");
      return this.make(root.elsif, "END_IF");
    }

    LOOP:
    while (this.stack.length) {
      var node = this.stack.shift();
      var value = node.capture[0].trim();

      switch (node.name) {
        case "NOT":
          root.conditions.push({
            type: "Not"
          });

          break;

        case "EQUALITY":
        case "NOT_EQUALITY":
        case "GREATER_THAN":
        case "GREATER_THAN_EQUAL":
        case "LESS_THAN":
        case "LESS_THAN_EQUAL":
          root.conditions.push({
            type: "Equality",
            value: node.capture[0].trim()
          });

          break;

        case "END_EXPR":
          break LOOP;

        default:
          var prevCondition = root.conditions[root.conditions.length - 1];

          // If it's a whitespace we need the non-trimmed value
          if (node.name === "WHITESPACE") {
            value = node.capture[0];

            if (!root.conditions.length || prevCondition.type !== "Literal") {
              break;
            }
          }

          // Parse out the argument property to whether it's a Literal value
          // or not.
          var property = parseProperty(value);

          if (property.type === "Literal") {
            root.conditions.push(property);
          }
          else if (prev.type === "Literal") {
            prev.value += value;
          }
          else {
            if (node.name != "START_RAW" && node.name != "START_PROP") {
              // this value needs to be processed by constructProperty so put
              // it back on the top of the stack
              this.stack.unshift(node);
            }

            root.conditions.push({
              type: "Identifier",
              value: this.constructProperty(node.name != "START_RAW")
            });
          }

          break;
      }

      // Store the previous condition object if it exists.
      prev = root.conditions[root.conditions.length - 1] || {};
    }

    if (kind !== "SKIP") {
      this.make(root, "END_IF");
    }

    return root;
  };

  /**
   * Build a descriptor to describe an instance of an expression.
   *
   * @memberOf module:tree.Tree
   * @param {object} root - Current token in stack or tree node to process.
   * @param {string} END - Token name to cause an expression to end processing.
   * @return {object} The root element decorated.
   */
  Tree.prototype.constructExpression = function(root, END) {
    var expressionRoot = {
      nodes: []
    };

    // Find the type.
    while (this.stack.length) {
      var type = this.stack.shift();

      switch (type.name) {
        //  WHEN ANY OF THESE ARE HIT, BREAK OUT.
        case END:
          return;

        case "WHITESPACE":
          break;

        case "COMMENT":
          return this.constructComment(expressionRoot);

        case "START_EACH":
          return this.constructEach(expressionRoot);

        case "ELSIF":
        case "ELSE":
        case "START_IF":
          if (type.name !== "START_IF") {
            expressionRoot = root;
          }

          return this.constructConditional(expressionRoot, type.name);

        case "PARTIAL":
          return this.constructPartial(expressionRoot);

        case "START_EXTEND":
          return this.constructExtend(expressionRoot);

        default:
          throw new Error("Invalid expression type: " + type.name);
      }
    }
  };

  module.exports = Tree;
});
