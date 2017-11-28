'use strict';

var assert = require('assert')
  , ase = assert.strictEqual
  , proxy = require('./index')
  , EventEmitter = require('events').EventEmitter

describe('event-proxy', function() {
  it('should proxy events to functions', function(next) {
    var emitter = new EventEmitter()
      , scope = process
      , len = 2

    function done() {
      --len || next()
    }
    var map = {
      foo: foo
    , bar: bar
    }
    proxy(scope, map, emitter, 'a')

    function foo(a, one, two, three) {
      ase(a, 'a')
      ase(one, 1)
      ase(two, 2)
      ase(three, 3)
      ase(this, process)
      done()
    }
    function bar(a, hey, there) {
      ase(a, 'a')
      ase(hey, 'hey')
      ase(there, 'there')
      ase(this, process)
      done()
    }
    emitter.emit('foo', 1, 2, 3)
    emitter.emit('bar', 'hey', 'there')
  })

  it('should proxy events to methods on scope', function(next) {
    var emitter = new EventEmitter()
      , foo
      , map
      , len = 2

    function done() {
      --len || next()
    }
    function Foo() {
      this.one = 1
    }
    Foo.prototype.bark = function(one) {
      ase(this, foo)
      ase(one, 1)
      done()
    }
    Foo.prototype.meow = function(two) {
      ase(this, foo)
      ase(two, 2)
      done()
    }
    foo = new Foo()

    map = {
      bark: 'bark'
    , meow: 'meow'
    }
    proxy(foo, map, emitter)

    emitter.emit('bark', 1)
    emitter.emit('meow', 2)
  })

  it('should proxy an array of methods', function(next) {
    var emitter = new EventEmitter()
      , map
      , len = 6

    function done() {
      --len || next()
    }
    function one(a, b, c) {
      ase(this, null)
      ase(a, 20)
      ase(b, true)
      ase(c, 'asdf')
      done()
    }
    function two(a, b, c) {
      ase(this, null)
      ase(a, 20)
      ase(b, true)
      ase(c, 'asdf')
      done()
    }
    function three(a, b, c) {
      ase(this, null)
      ase(a, 20)
      ase(b, true)
      ase(c, 'asdf')
      done()
    }
    map = {
      'thing': [one, two, three]
    }
    proxy(null, map, emitter)

    emitter.emit('thing', 20, true, 'asdf')

    map = {
      'rawr': [one, two, three]
    }
    proxy(null, map, emitter, 20, true)

    emitter.emit('rawr', 'asdf')
  })

  it('should proxy events to the same named method of a scope', function(next) {
    var emitter = new EventEmitter()
      , map
      , len = 3

    function done() {
      --len || next()
    }

    var almond = {
      one: function() {
        ase(this, almond)
        done()
      }
    , two: function() {
        done()
      }
    , three: function() {
        done()
      }
    }
    proxy(almond, ['one', 'two', 'three'], emitter)

    emitter.emit('one')
    emitter.emit('two')
    emitter.emit('three')
  })
})
