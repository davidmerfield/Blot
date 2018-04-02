# duplex-pipe

A friendlier `.pipe()` for duplex streams that doesn't do cleanup on `'end'`, as
per
[this node core issue](https://github.com/joyent/node/pull/2524#issuecomment-8790281).

# methods

This is exactly the same as node 0.8 core Stream except that duplex-pipe will
not do `dest.on('end', cleanup)` if `dest` is readable.

Plus there is another hack to remove cleanup listeners when piped to.

# install

With [npm](https://npmjs.org) do:

```
npm install duplex-pipe
```

# license

MIT
