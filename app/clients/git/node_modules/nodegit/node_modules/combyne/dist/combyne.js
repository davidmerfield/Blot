(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.combyne = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var registerPartial = require('./shared/register_partial');
var registerFilter = require('./shared/register_filter');
var getPartial = require('./shared/get_partial');
var getFilter = require('./shared/get_filter');
var map = require('./shared/map');
var encode = require('./shared/encode');
var type = require('./utils/type');
var createObject = require('./utils/create_object');
require('./support/array/map');
require('./support/array/reduce');
var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
var escapes = {
        '\'': '\'',
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };
function escapeValue(value) {
    return value.replace(escaper, function (match) {
        return '\\' + escapes[match];
    });
}
function normalizeIdentifier(identifier) {
    if (identifier === '.') {
        return '(data[\'.\'] || data)';
    }
    return 'data' + identifier.split('.').map(function (property) {
        return property ? '[\'' + property + '\']' : '';
    }).join('');
}
function Compiler(tree) {
    this.tree = tree;
    this.string = '';
    var nodes = this.optimize(this.tree.nodes);
    var compiledSource = this.process(nodes);
    var body = [];
    if (compiledSource) {
        compiledSource = ' + ' + compiledSource;
    }
    if (compiledSource.indexOf('map(') > -1) {
        body.push(createObject, type, map);
    }
    if (compiledSource.indexOf('encode(') > -1) {
        body.push(type, encode);
    }
    body = body.concat(['return \'\'' + compiledSource]).join(';\n');
    this.func = new Function('data', 'template', body);
    this.source = [
        '{',
        '_partials: {},',
        '_filters: {},',
        'getPartial: ' + getPartial + ',',
        'getFilter: ' + getFilter + ',',
        'registerPartial: ' + registerPartial + ',',
        'registerFilter: ' + registerFilter + ',',
        'render: function(data) {',
        'return ' + this.func + '(data, this)',
        '}',
        '}'
    ].join('\n');
}
Compiler.prototype.optimize = function (nodes) {
    return nodes.reduce(function (memo, node) {
        var previous = memo[memo.length - 1];
        if (previous && previous.type === 'Text' && node.type === 'Text') {
            previous.value += node.value;
        } else {
            memo.push(node);
        }
        return memo;
    }, []);
};
Compiler.prototype.process = function (nodes, keyVal) {
    var commands = [];
    nodes.map(function (node, index) {
        switch (node.type) {
        case 'RawProperty':
            commands.push(this.compileProperty(node, false));
            break;
        case 'Property':
            commands.push(this.compileProperty(node, true));
            break;
        case 'ConditionalExpression':
            commands.push(this.compileConditional(node));
            break;
        case 'LoopExpression':
            commands.push(this.compileLoop(node));
            break;
        case 'PartialExpression':
            commands.push(this.compilePartial(node));
            break;
        case 'ExtendExpression':
            commands.push(this.compileExtend(node));
            break;
        default:
            if (node.value) {
                commands.push('\'' + escapeValue(node.value) + '\'');
            }
            break;
        }
    }, this);
    return commands.join('+');
};
Compiler.prototype.compileProperty = function (node, encode) {
    var identifier = node.value;
    if (identifier.indexOf('\'') === -1 && identifier.indexOf('"') === -1) {
        identifier = normalizeIdentifier(node.value);
    }
    var normalizeArgs = node.args.map(function (arg) {
            var value = arg.value;
            return arg.type === 'Literal' ? value : normalizeIdentifier(value);
        });
    var value = [
            '(',
            'typeof',
            identifier,
            '===',
            '\'function\'',
            '?',
            encode ? 'encode(' + identifier + '(' + normalizeArgs + '))' : identifier + '(' + normalizeArgs + ')',
            ':',
            encode ? 'encode(' + identifier + ') == null ? \'\' : encode(' + identifier + ')' : identifier + ' == null ? \'\' : ' + identifier,
            ')'
        ].join(' ');
    value = node.filters.reduce(function (memo, filter) {
        var args = filter.args.length ? ', ' + filter.args.map(function (arg) {
                var value = arg.value;
                if (value.indexOf('\'') === -1 && value.indexOf('"') === -1) {
                    if (Number(value) !== Number(value)) {
                        if (value !== 'true' && value !== 'false') {
                            return normalizeIdentifier(value);
                        }
                    }
                }
                return value;
            }).join(', ') : '';
        return 'template.getFilter(\'' + filter.value + '\')' + '(' + memo + args + ')';
    }, value);
    return value;
};
Compiler.prototype.compileConditional = function (node) {
    if (node.conditions.length === 0) {
        throw new Error('Missing conditions to if statement');
    }
    var _this = this;
    var condition = node.conditions.map(function (condition) {
            switch (condition.type) {
            case 'Identifier':
                return _this.compileProperty(condition.value, condition.value.type == 'Property');
            case 'Not':
                return '!';
            case 'Literal':
                return condition.value;
            case 'Equality':
                return condition.value;
            }
        }).join('');
    var els = node.els ? this.process(node.els.nodes) : null;
    var elsif = node.elsif ? this.compileConditional(node.elsif) : null;
    return [
        '(',
        '(',
        condition,
        ')',
        '?',
        this.process(node.nodes) || '\'\'',
        ':',
        els || elsif || '\'\'',
        ')'
    ].join('');
};
Compiler.prototype.compileLoop = function (node) {
    var conditions = node.conditions;
    var keyVal = [
            conditions[3] ? conditions[3].value : 'i',
            conditions[2] ? conditions[2].value : '.'
        ];
    var value = conditions.length && conditions[0].value;
    var loop = [
            'map(',
            value ? this.compileProperty(value, value.type == 'Property') : 'data',
            ',',
            '\'',
            keyVal[0],
            '\'',
            ',',
            '\'',
            value ? keyVal[1] : '',
            '\'',
            ',',
            'data',
            ',',
            'function(data) {',
            'return ' + this.process(node.nodes, keyVal),
            '}',
            ').join(\'\')'
        ].join('');
    return loop;
};
Compiler.prototype.compilePartial = function (node) {
    return [
        '(',
        'template.getPartial(\'',
        node.value,
        '\').render(',
        typeof node.data !== 'string' ? this.compileProperty(node.data, true) : node.data,
        ')',
        ')'
    ].join('');
};
Compiler.prototype.compileExtend = function (node) {
    return [
        '(',
        'template.getPartial(\'',
        node.value.template.trim(),
        '\').registerPartial',
        '(\'',
        node.value.partial.trim(),
        '\', { render: function(_data) {',
        'data = _data || data;',
        'return ',
        this.process(node.nodes),
        ';',
        '}, data: data, _filters: {}, _partials: {} }),',
        'template.getPartial(\'',
        node.value.template.trim(),
        '\').render(data)',
        ')'
    ].join('');
};
module.exports = Compiler;
},{"./shared/encode":4,"./shared/get_filter":5,"./shared/get_partial":6,"./shared/map":7,"./shared/register_filter":8,"./shared/register_partial":9,"./support/array/map":11,"./support/array/reduce":12,"./utils/create_object":17,"./utils/type":21}],2:[function(require,module,exports){
'use strict';
var escapeDelimiter = require('./utils/escape_delimiter');
require('./support/array/map');
require('./support/array/some');
function Grammar(delimiters) {
    this.delimiters = delimiters;
    this.internal = [
        makeEntry('START_IF', 'if'),
        makeEntry('ELSE', 'else'),
        makeEntry('ELSIF', 'elsif'),
        makeEntry('END_IF', 'endif'),
        makeEntry('NOT', 'not'),
        makeEntry('EQUALITY', '=='),
        makeEntry('NOT_EQUALITY', '!='),
        makeEntry('GREATER_THAN_EQUAL', '>='),
        makeEntry('GREATER_THAN', '>'),
        makeEntry('LESS_THAN_EQUAL', '<='),
        makeEntry('LESS_THAN', '<'),
        makeEntry('START_EACH', 'each'),
        makeEntry('END_EACH', 'endeach'),
        makeEntry('ASSIGN', 'as'),
        makeEntry('PARTIAL', 'partial'),
        makeEntry('START_EXTEND', 'extend'),
        makeEntry('END_EXTEND', 'endextend'),
        makeEntry('MAGIC', '.')
    ];
}
function makeEntry(name, value) {
    var escaped = escapeDelimiter(value);
    return {
        name: name,
        escaped: escaped,
        test: new RegExp('^' + escaped)
    };
}
Grammar.prototype.escape = function () {
    var grammar = [
            'START_RAW',
            'START_PROP',
            'START_EXPR',
            'END_RAW',
            'END_PROP',
            'END_EXPR',
            'COMMENT',
            'FILTER'
        ];
    grammar = grammar.map(function (key) {
        return makeEntry(key, this.delimiters[key]);
    }, this);
    grammar.push.apply(grammar, this.internal);
    var string = grammar.map(function (value) {
            return value.escaped;
        }).join('|');
    grammar.push({
        name: 'WHITESPACE',
        test: /^[\ \t\r\n]+/
    });
    string += '| |\t|\r|\n';
    grammar.push({
        name: 'OTHER',
        test: new RegExp('^((?!' + string + ').)*')
    });
    return grammar;
};
module.exports = Grammar;
},{"./support/array/map":11,"./support/array/some":13,"./utils/escape_delimiter":19}],3:[function(require,module,exports){
'use strict';
var Grammar = require('./grammar');
var Tokenizer = require('./tokenizer');
var Tree = require('./tree');
var Compiler = require('./compiler');
var registerPartial = require('./shared/register_partial');
var registerFilter = require('./shared/register_filter');
var getPartial = require('./shared/get_partial');
var getFilter = require('./shared/get_filter');
var type = require('./utils/type');
var defaults = require('./utils/defaults');
var defaultDelimiters = {
        START_RAW: '{{{',
        END_RAW: '}}}',
        START_PROP: '{{',
        END_PROP: '}}',
        START_EXPR: '{%',
        END_EXPR: '%}',
        COMMENT: '--',
        FILTER: '|'
    };
function Combyne(template, data) {
    if (!(this instanceof Combyne)) {
        return new Combyne(template, data);
    }
    this.template = template;
    this.data = data || {};
    this._partials = {};
    this._filters = {};
    if (type(this.template) !== 'string') {
        throw new Error('Template must be a String.');
    }
    var delimiters = defaults(Combyne.settings.delimiters, defaultDelimiters);
    var grammar = new Grammar(delimiters).escape();
    var stack = new Tokenizer(this.template, grammar).parse();
    var tree = new Tree(stack).make();
    this.tree = tree;
    this.stack = stack;
    this.compiler = new Compiler(tree);
    this.source = this.compiler.source;
}
Combyne.prototype.registerPartial = registerPartial;
Combyne.prototype.registerFilter = registerFilter;
Combyne.prototype.getPartial = getPartial;
Combyne.prototype.getFilter = getFilter;
Combyne.settings = {};
Combyne.prototype.render = function (data) {
    this.data = data || this.data;
    return this.compiler.func(this.data, this);
};
Combyne.VERSION = '0.8.1';
module.exports = Combyne;
},{"./compiler":1,"./grammar":2,"./shared/get_filter":5,"./shared/get_partial":6,"./shared/register_filter":8,"./shared/register_partial":9,"./tokenizer":15,"./tree":16,"./utils/defaults":18,"./utils/type":21}],4:[function(require,module,exports){
'use strict';
var type = require('../utils/type');
function encode(raw) {
    if (type(raw) !== 'string') {
        return raw;
    }
    return raw.replace(/["&'<>`]/g, function (match) {
        return '&#' + match.charCodeAt(0) + ';';
    });
}
module.exports = encode;
},{"../utils/type":21}],5:[function(require,module,exports){
'use strict';
function getFilter(name) {
    if (name in this._filters) {
        return this._filters[name];
    } else if (this._parent) {
        return this._parent.getFilter(name);
    }
    throw new Error('Missing filter ' + name);
}
module.exports = getFilter;
},{}],6:[function(require,module,exports){
'use strict';
function getPartial(name) {
    if (name in this._partials) {
        return this._partials[name];
    } else if (this._parent) {
        return this._parent.getPartial(name);
    }
    throw new Error('Missing partial ' + name);
}
module.exports = getPartial;
},{}],7:[function(require,module,exports){
'use strict';
var type = require('../utils/type');
var createObject = require('../utils/create_object');
require('../support/array/is_array');
function map(obj, index, value, data, iterator) {
    var isArrayLike = type(obj) === 'arguments' || type(obj) === 'nodelist';
    var isArray = Array.isArray(obj) || isArrayLike;
    var output = [];
    var dataObject;
    if (isArray) {
        obj = [].slice.call(obj);
        for (var i = 0; i < obj.length; i++) {
            dataObject = createObject(data);
            dataObject[index] = i;
            if (value) {
                dataObject[value] = obj[i];
            } else {
                dataObject = obj[i];
            }
            output.push(iterator(dataObject));
        }
        return output;
    } else {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }
            dataObject = createObject(data);
            dataObject[index] = key;
            if (value) {
                dataObject[value] = obj[key];
            } else {
                dataObject = obj[key];
            }
            output.push(iterator(dataObject));
        }
        return output;
    }
}
module.exports = map;
},{"../support/array/is_array":10,"../utils/create_object":17,"../utils/type":21}],8:[function(require,module,exports){
'use strict';
function registerFilter(name, callback) {
    this._filters[name] = callback;
}
module.exports = registerFilter;
},{}],9:[function(require,module,exports){
'use strict';
function registerPartial(partialName, template) {
    this._partials[partialName] = template;
    template._parent = this;
}
module.exports = registerPartial;
},{}],10:[function(require,module,exports){
'use strict';
var type = require('../../utils/type');
if (Array.isArray) {
    return isArray;
}
function isArray(arg) {
    return type(arg) === '[object Array]';
}
module.exports = Array.isArray = isArray;
},{"../../utils/type":21}],11:[function(require,module,exports){
'use strict';
if (Array.prototype.map) {
    return map;
}
function map(iterator, thisArg) {
    if (this == null) {
        throw new TypeError();
    }
    if (typeof iterator !== 'function') {
        throw new TypeError();
    }
    thisArg = thisArg || this;
    var array = Array.prototype.slice.call(this);
    var retVal = [];
    for (var i = 0; i < array.length; i++) {
        if (i in array) {
            retVal[retVal.length] = iterator.call(thisArg, array[i], i, array);
        }
    }
    return retVal;
}
module.exports = Array.prototype.map = map;
},{}],12:[function(require,module,exports){
'use strict';
if (Array.prototype.reduce) {
    return reduce;
}
function reduce(iterator, memo) {
    if (this == null) {
        throw new TypeError();
    }
    if (typeof iterator !== 'function') {
        throw new TypeError();
    }
    var array = Array.prototype.slice.call(this);
    for (var i = 0; i < array.length; i++) {
        if (i in array) {
            memo = iterator(memo, array[i], i, array);
        }
    }
    return memo;
}
module.exports = Array.prototype.reduce = reduce;
},{}],13:[function(require,module,exports){
'use strict';
if (Array.prototype.some) {
    return some;
}
function some(iterator, thisArg) {
    if (this == null) {
        throw new TypeError();
    }
    if (typeof iterator !== 'function') {
        throw new TypeError();
    }
    thisArg = thisArg || this;
    var array = Array.prototype.slice.call(this);
    for (var i = 0; i < array.length; i++) {
        if (i in array) {
            if (iterator.call(thisArg, array[i], i, array)) {
                return true;
            }
        }
    }
    return false;
}
module.exports = Array.prototype.some = some;
},{}],14:[function(require,module,exports){
'use strict';
if (String.prototype.trim) {
    return trim;
}
function trim() {
    return this.replace(/^\s+|\s+$/g, '');
}
module.exports = String.prototype.trim = trim;
},{}],15:[function(require,module,exports){
'use strict';
require('./support/array/some');
function Tokenizer(template, grammar) {
    this.template = template;
    this.grammar = grammar;
    this.stack = [];
}
function parseNextToken(template, grammar, stack) {
    grammar.some(function (token) {
        var capture = token.test.exec(template);
        if (capture && capture[0]) {
            template = template.replace(token.test, '');
            stack.push({
                name: token.name,
                capture: capture
            });
            return true;
        }
    });
    return template;
}
Tokenizer.prototype.parse = function () {
    var template = this.template;
    var grammar = this.grammar;
    var stack = this.stack;
    var stackLen = 0;
    while (template.length) {
        template = parseNextToken(template, grammar, stack);
        stackLen = stack.length;
        if (stackLen - 2 >= 0) {
            stack[stackLen - 1].previous = stack[stackLen - 2];
        }
    }
    return stack;
};
module.exports = Tokenizer;
},{"./support/array/some":13}],16:[function(require,module,exports){
'use strict';
require('./support/string/trim');
var parseProperty = require('./utils/parse_property');
function Tree(stack) {
    this.stack = stack.slice();
    this.root = {
        type: 'Template',
        nodes: []
    };
}
Tree.prototype.make = function (root, END) {
    root = root || this.root;
    var node, result, prev, next;
    var index = 0;
    while (this.stack.length) {
        node = this.stack.shift();
        prev = node.previous || {};
        next = this.stack[0] || {};
        switch (node.name) {
        case 'START_RAW':
            root.nodes.push(this.constructProperty(false));
            break;
        case 'START_PROP':
            root.nodes.push(this.constructProperty(true));
            break;
        case 'START_EXPR':
            if (result = this.constructExpression(root, END)) {
                root.nodes.push(result);
                break;
            } else if (result !== false) {
                return null;
            }
            break;
        case 'END_EXPR':
            break;
        case 'WHITESPACE':
            var capture = node.capture[0];
            var idx = capture.indexOf('\n');
            if (prev.name === 'END_EXPR') {
                if (next.name === 'START_EXPR' && idx > -1) {
                    capture = '';
                } else if (idx > -1) {
                    capture = capture.slice(idx + 1);
                }
            } else if (prev.name && next.name === 'START_EXPR' && idx > -1) {
                capture = capture.slice(0, capture.lastIndexOf('\n') + 1);
            }
            root.nodes.push({
                type: 'Text',
                value: capture
            });
            break;
        default:
            var prevWhitespace = '';
            prev = root.nodes[root.nodes.length - 1] || {};
            root.nodes.push({
                type: 'Text',
                value: prevWhitespace + node.capture[0]
            });
            break;
        }
        ++index;
    }
    return root;
};
Tree.prototype.constructProperty = function (encoded) {
    var propertyDescriptor = {
            type: encoded ? 'Property' : 'RawProperty',
            value: '',
            args: [],
            filters: []
        };
    var previous;
    var input = '';
    var processParsedProperty = function () {
        var parts = input.trim().split(' ');
        propertyDescriptor.value = parts[0];
        propertyDescriptor.args = parts.slice(1).map(parseProperty);
    };
    while (this.stack.length) {
        var node = this.stack.shift();
        var next = this.stack[0] || {};
        if (node.name === 'ASSIGN' && next.name !== 'WHITESPACE') {
            node.name = 'OTHER';
        }
        switch (node.name) {
        case 'FILTER':
            propertyDescriptor.value = input.trim();
            return this.constructFilter(propertyDescriptor);
        case 'END_EXPR':
        case 'EQUALITY':
        case 'NOT_EQUALITY':
        case 'GREATER_THAN':
        case 'GREATER_THAN_EQUAL':
        case 'LESS_THAN':
        case 'LESS_THAN_EQUAL':
        case 'ASSIGN':
            processParsedProperty();
            this.stack.unshift(node);
            return propertyDescriptor;
        case 'END_RAW':
        case 'END_PROP':
        case 'END_EXPR':
            processParsedProperty();
            return propertyDescriptor;
        default:
            input += node.capture[0];
            break;
        }
        previous = node;
    }
    throw new Error('Unterminated property.');
};
Tree.prototype.constructExtend = function (root) {
    root.type = 'ExtendExpression';
    var value = {
            template: '',
            partial: ''
        };
    var side = 'template';
    LOOP:
        while (this.stack.length) {
            var node = this.stack.shift();
            switch (node.name) {
            case 'END_EXPR':
                break LOOP;
            case 'ASSIGN':
                side = 'partial';
                break;
            default:
                value[side] += node.capture[0];
                break;
            }
        }
    value.template = value.template.trim();
    value.partial = value.partial.trim();
    root.value = value;
    if (!root.value.template) {
        throw new Error('Missing valid template name.');
    }
    if (!root.value.partial) {
        throw new Error('Missing valid partial name.');
    }
    this.make(root, 'END_EXTEND');
    return root;
};
Tree.prototype.constructPartial = function (root) {
    root.type = 'PartialExpression';
    root.value = '';
    root.data = 'null';
    delete root.nodes;
    var wsCount = 0;
    LOOP:
        while (this.stack.length) {
            var node = this.stack.shift();
            switch (node.name) {
            case 'END_EXPR':
                break LOOP;
            default:
                if (node.name === 'WHITESPACE') {
                    wsCount++;
                }
                if (wsCount === 1) {
                    root.value += node.capture[0].trim();
                } else {
                    root.data = this.constructProperty(true);
                }
                break;
            }
        }
    if (!root.value) {
        throw new Error('Missing valid partials name.');
    }
    return root;
};
Tree.prototype.constructFilter = function (root) {
    var current = {
            type: 'Filter',
            args: []
        };
    var previous;
    var input = '';
    LOOP:
        while (this.stack.length) {
            var node = this.stack.shift();
            var next = this.stack[0] || {};
            if (node.name === 'ASSIGN' && next.name !== 'WHITESPACE') {
                node.name = 'OTHER';
            }
            switch (node.name) {
            case 'END_EXPR':
            case 'EQUALITY':
            case 'NOT_EQUALITY':
            case 'GREATER_THAN':
            case 'GREATER_THAN_EQUAL':
            case 'LESS_THAN':
            case 'LESS_THAN_EQUAL':
            case 'ASSIGN':
                root.filters.push(current);
                this.stack.unshift(node);
                break LOOP;
            case 'END_RAW':
            case 'END_PROP':
                root.filters.push(current);
                break LOOP;
            case 'FILTER':
                root.filters.push(current);
                this.constructFilter(root);
                break LOOP;
            default:
                input += node.capture[0];
            }
            previous = node;
        }
    var parts = input.trim().split(' ');
    current.value = parts[0];
    if (!current.value) {
        throw new Error('Missing valid filter name.');
    }
    current.args = parts.slice(1).map(parseProperty);
    return root;
};
Tree.prototype.constructEach = function (root) {
    root.type = 'LoopExpression';
    root.conditions = [];
    var isLeftSide = true;
    LOOP:
        while (this.stack.length) {
            var node = this.stack.shift();
            switch (node.name) {
            case 'ASSIGN':
                isLeftSide = false;
                root.conditions.push({
                    type: 'Assignment',
                    value: node.capture[0].trim()
                });
                break;
            case 'END_EXPR':
                break LOOP;
            case 'WHITESPACE':
                break;
            default:
                if (!isLeftSide) {
                    root.conditions.push({
                        type: 'Identifier',
                        value: node.capture[0].trim()
                    });
                } else {
                    this.stack.unshift(node);
                    root.conditions.push({
                        type: 'Identifier',
                        value: this.constructProperty(node.name != 'START_RAW')
                    });
                }
                break;
            }
        }
    this.make(root, 'END_EACH');
    return root;
};
Tree.prototype.constructComment = function (root) {
    var previous = {};
    while (this.stack.length) {
        var node = this.stack.shift();
        switch (node.name) {
        case 'COMMENT':
            if (previous.name === 'START_EXPR') {
                this.constructComment(root);
            }
            break;
        case 'END_EXPR':
            if (previous.name === 'COMMENT') {
                return false;
            }
            break;
        }
        previous = node;
    }
    return false;
};
Tree.prototype.constructConditional = function (root, kind) {
    root.type = root.type || 'ConditionalExpression';
    root.conditions = root.conditions || [];
    var prev = {};
    if (kind === 'ELSE') {
        root.els = {
            nodes: [],
            type: 'ConditionalExpression'
        };
        return this.make(root.els, 'END_IF');
    }
    if (kind === 'ELSIF') {
        root.elsif = { nodes: [] };
        this.constructConditional(root.elsif, 'SKIP');
        return this.make(root.elsif, 'END_IF');
    }
    LOOP:
        while (this.stack.length) {
            var node = this.stack.shift();
            var value = node.capture[0].trim();
            switch (node.name) {
            case 'NOT':
                root.conditions.push({ type: 'Not' });
                break;
            case 'EQUALITY':
            case 'NOT_EQUALITY':
            case 'GREATER_THAN':
            case 'GREATER_THAN_EQUAL':
            case 'LESS_THAN':
            case 'LESS_THAN_EQUAL':
                root.conditions.push({
                    type: 'Equality',
                    value: node.capture[0].trim()
                });
                break;
            case 'END_EXPR':
                break LOOP;
            default:
                var prevCondition = root.conditions[root.conditions.length - 1];
                if (node.name === 'WHITESPACE') {
                    value = node.capture[0];
                    if (!root.conditions.length || prevCondition.type !== 'Literal') {
                        break;
                    }
                }
                var property = parseProperty(value);
                if (property.type === 'Literal') {
                    root.conditions.push(property);
                } else if (prev.type === 'Literal') {
                    prev.value += value;
                } else {
                    if (node.name != 'START_RAW' && node.name != 'START_PROP') {
                        this.stack.unshift(node);
                    }
                    root.conditions.push({
                        type: 'Identifier',
                        value: this.constructProperty(node.name != 'START_RAW')
                    });
                }
                break;
            }
            prev = root.conditions[root.conditions.length - 1] || {};
        }
    if (kind !== 'SKIP') {
        this.make(root, 'END_IF');
    }
    return root;
};
Tree.prototype.constructExpression = function (root, END) {
    var expressionRoot = { nodes: [] };
    while (this.stack.length) {
        var type = this.stack.shift();
        switch (type.name) {
        case END:
            return;
        case 'WHITESPACE':
            break;
        case 'COMMENT':
            return this.constructComment(expressionRoot);
        case 'START_EACH':
            return this.constructEach(expressionRoot);
        case 'ELSIF':
        case 'ELSE':
        case 'START_IF':
            if (type.name !== 'START_IF') {
                expressionRoot = root;
            }
            return this.constructConditional(expressionRoot, type.name);
        case 'PARTIAL':
            return this.constructPartial(expressionRoot);
        case 'START_EXTEND':
            return this.constructExtend(expressionRoot);
        default:
            throw new Error('Invalid expression type: ' + type.name);
        }
    }
};
module.exports = Tree;
},{"./support/string/trim":14,"./utils/parse_property":20}],17:[function(require,module,exports){
'use strict';
function createObject(parent) {
    function F() {
    }
    F.prototype = parent;
    return new F();
}
module.exports = createObject;
},{}],18:[function(require,module,exports){
'use strict';
function defaults(target, source) {
    target = target || {};
    source = source;
    for (var key in source) {
        if (!source.hasOwnProperty(key)) {
            continue;
        }
        if (!(key in target)) {
            target[key] = source[key];
        }
    }
    return target;
}
module.exports = defaults;
},{}],19:[function(require,module,exports){
'use strict';
var specialCharsExp = /[\^$\\\/.*+?()\[\]{}|]/g;
function escapeDelimiter(delimiter) {
    return delimiter.replace(specialCharsExp, '\\$&');
}
module.exports = escapeDelimiter;
},{}],20:[function(require,module,exports){
'use strict';
var isString = /['"]+/;
function parseProperty(value) {
    var retVal = {
            type: 'Property',
            value: value
        };
    if (value === 'false' || value === 'true') {
        retVal.type = 'Literal';
    } else if (Number(value) === Number(value)) {
        retVal.type = 'Literal';
    } else if (isString.test(value)) {
        retVal.type = 'Literal';
    }
    return retVal;
}
module.exports = parseProperty;
},{}],21:[function(require,module,exports){
'use strict';
function type(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}
module.exports = type;
},{}]},{},[3])(3)
});