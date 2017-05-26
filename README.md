I recommend you wait until I write a setup guide before attempting to run Blot on your own server. 

My distant goal for the project would be for you, the self-hoster, to be able to do something like this:

```
$ npm install blot -g
$ blot /path/to/folder
```

or something like this:

```javascript
var blot = require('blot');
var blog = blot('/path/to/folder');

blog.listen(8080);
```

Your blog would be built each time the process started and stored in memory. All you'd need to install would be node.js. This is a long way off but I will get there eventually! At the moment, Blot depends on redis, pandoc and nginx.

Eventually I will sell Blot to self-hosters. It will be priced reasonably, with an option to pay for support. I like how Kirby does it.
