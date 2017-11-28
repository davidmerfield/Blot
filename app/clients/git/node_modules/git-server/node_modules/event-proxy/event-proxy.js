/**
 * (c) 2012 Beau Sorensen
 * MIT Licensed
 * For all details and documentation:
 * https://github.com/sorensen/defined-args
 */

;(function() {
'use strict'

/*!
 * Module dependencies.
 */

var concat = Array.prototype.concat
  , slice = Array.prototype.slice
  , toString = Object.prototype.toString
  , listener = 'on'

/**
 * Check for array
 *
 * @param {Any} obj
 * @returns {Boolean} result
 * @api private
 */

function isArray(obj) {
  return toString.call(obj) === '[object Array]'
}

/**
 * Call a method of the given scope, prepending any given
 * args to the function call along with sent arguments
 *
 * @param {Object} scope of method call
 * @param {String} method name
 * @param {...} additional arguments to be used every method call
 * @return {Object} js object
 * @api private
 */

function bind(scope, method) {
  var args = slice.call(arguments, 2)

  if (typeof method === 'string') {
    method = scope[method]
  }
  if (!method) {
    throw new Error('Proxy: method `' + method + '` does not exist')
  }
  return function() {
    return method.apply(scope, concat.apply(args, arguments))
  }
}

/**
 * Setup all proxy methods, if an array is supplied for the methods
 * the event will be proxied to a method of the same name
 *
 * Examples:
 *
 *     proxy()
 *
 * @param {Object} scope of method calls
 * @param {Array|Objects} methods to bind
 * @param {Object} event emitting object
 * @param {...} additional arguments to be used on every method
 * @api public
 */

function proxy(scope, map, emitter) {
  var args = slice.call(arguments, 3)
    , tmp = {}, len, name, methods, method, i

  if (isArray(map)) {
    len = map.length
    while (len--) {
      tmp[map[len]] = map[len]
    }
    map = tmp
  }
  for (name in map) {
    methods = map[name]
    if (!isArray(methods)) {
      methods = [methods]
    }
    for (i = 0; i < methods.length; i++) {
      method = methods[i]
      if (typeof method === 'string') {
        method = scope[method]
      }
      if (!method) {
        throw new Error('Proxy: method `' + method + '` does not exist')
      }
      emitter[listener](name, bind.apply(scope, concat.apply([scope, method], args)))
    }
  }
}

/**
 * Change the emitter's listener method name
 *
 * @param {String} method name
 * @api public
 */

proxy.config = function(method) {
  listener = method || listener
}

/**
 * Current library version, should match `package.json`
 */

proxy.VERSION = '0.0.1'

/*!
 * Module exports.
 */

if (typeof exports !== 'undefined') {
  module.exports = proxy
} else {
  this.proxy = proxy
}

}).call(this);
