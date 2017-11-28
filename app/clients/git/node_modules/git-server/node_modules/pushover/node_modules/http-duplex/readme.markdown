# http-duplex

Turn (req,res) pairs into a single readable/writable stream.

[![build status](https://secure.travis-ci.org/substack/http-duplex.png)](http://travis-ci.org/substack/http-duplex)

# example

# methods

``` js
var httpDuplex = require('http-duplex')
```

## var dup = httpDuplex(req, res)

Return a new readable/writable duplex stream `dup` from the http request `req`
and http response `res`.

`dup` has all the same methods has both `req` and `res`, but on a single object.

# install

With [npm](https://npmjs.org) do:

```
npm install http-duplex
```

# license

MIT
