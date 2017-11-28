
Event Proxy
===========

[![Build Status](https://secure.travis-ci.org/sorensen/event-proxy.png)](http://travis-ci.org/sorensen/event-proxy) 

Event proxying for node.js or the browser.  Simple utility to route events to 
methods with the ability to preserve scope or pass additional arguments. Can be 
used with `EventEmitter`, `jQuery`, `socket.io`, or `Backbone.Events`.


Usage
-----

Node.js

``` js
var proxy = require('event-proxy')
```

Browser

``` html
<script src="event-proxy.min.js"></script>
```


Methods
-------

### proxy(scope, map, emitter, …)

* `scope` 
* `map`
* `emitter`

Proxy all events from the emitter to their mapped functions with the applied 
scope. If the functions are strings, they must be present on the scope. Any 
additional arguments supplied to proxy are in turn sent to each method.

```js
var emitter = new require('events').EventEmitter

function meow(hi, animal) {
  console.log(hi) // 'hi'
  console.log(animal) // 'cat'
}
function bark(hi, animal) {
  console.log(hi) // 'hi'
  console.log(animal) // 'dog'
}

var map = {
  meow: meow
, bark: bark
}
proxy(process, map, emitter, 'hi')

emitter.emit('bark', 'dog')
emitter.emit('meow', 'cat')
```

The `map` can also be an array of methods.

```js
function one() {}
function two() {}

var map = {
  'hi': [one, two]
}
proxy(null, map, emitter)

emitter.emit('hi') // `one` and `two` both called
```

If an array is suppied, the values are assumed to be both event emitted and method
names of the given scope.

```js
var foo = {
  one: function() {}
, two: function() {}
}
proxy(foo, ['one', 'two'], emitter)

emitter.emit('one') // `one` called
emitter.emit('two') // `two` called
```

Additional arguments can be proxied as well, lets assume we have socket.io setup 
on the server. Normally the callbacks supplied to the socket have the socket as 
the `this` reference, but what if we want our instance as `this`?

```js
var io require('socket.io').listen(80)

function Engine() {
  this.things = 'crazy'
}
Engine.prototype.drive = function(socket, data) {
  socket.emit(this.things + data)
}
var map = {
  drive: 'drive'
}
var engine = new Engine()

io.sockets.on('connection', function(socket) {
  proxy(engine, map, socket, socket)
})
```

This also works in the browser with jQuery elements.

```html
<button id="btn">Proxy</button>
```

```js
var $button = $('#btn')

function click(event) {
  console.log(this === $button) // true
}

function mouseover(event) {
  console.log(this === $button) // true
}

var map = {
  click: click
, mouseover: mouseover
}
proxy(null, map, $button)
```

### proxy.config(listener)

Change the emitter listener method, default method is `on`

```js
proxy.config('on')
```


Install
-------

With [npm](https://npmjs.org)

```
npm install event-proxy
```


License
-------

(The MIT License)

Copyright (c) 2011-2012 Beau Sorensen <mail@beausorensen.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
