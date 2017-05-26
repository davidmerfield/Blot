I recommend you wait until I write a setup guide before attempting to run Blot on your own server. 

Eventually I will sell this to self-hosters who do *not* have a Blot subscription. 

My goal for the project would be for you to be able to do something like this:

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
