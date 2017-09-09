# Dropbox JavaScript SDK Documentation

<http://dropbox.github.io/dropbox-sdk-js>

The Dropbox JavaScript SDK is a lightweight, promise based interface to
the Dropbox v2 API that works in both nodejs and browser environments.

## Installation

#### Npm

Use [npm](https://www.npmjs.com/) for [nodejs](https://nodejs.org/en/),
[webpack](https://github.com/webpack/webpack) or
[browserify](http://browserify.org/):

```console
$ npm install dropbox --save
```

#### Script tag

The UMD build is available on [unpkg](https://unpkg.com/):

```html
<script src="https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js"></script>
```

You can find the library on `window.Dropbox`.

## Usage

#### Browser with `<script>`

```html
<script src="https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js"></script>
<script>
  var dbx = new Dropbox({ accessToken: 'YOUR_ACCESS_TOKEN_HERE' });
  dbx.filesListFolder({path: ''})
    .then(function(response) {
      console.log(response);
    })
    .catch(function(error) {
      console.log(error);
    });
</script>
```

#### Nodejs, Browserify or Webpack

```javascript
var Dropbox = require('dropbox');
var dbx = new Dropbox({ accessToken: 'YOUR_ACCESS_TOKEN_HERE' });
dbx.filesListFolder({path: ''})
  .then(function(response) {
    console.log(response);
  })
  .catch(function(error) {
    console.log(error);
  });
```

## General documentation

#### Endpoints

For documentation of all of the available endpoints, the parameters they
receive and the data they return, see the [Dropbox class
definition](http://dropbox.github.io/dropbox-sdk-js/Dropbox.html). These methods are all available directly from
an instance of the API class, ex: `dbx.filesListFolder()`.

#### Teams

The Dropbox API has a series of actions that can be completed on a team
wide level. These endpoint methods are available by using the DropboxTeam
class. It can be loaded like this: `var DropboxTeam
= require('dropbox/team');`. For more information , see the [DropboxTeam
class definition](http://dropbox.github.io/dropbox-sdk-js/DropboxTeam.html).

#### Authentication

The Dropbox SDK uses [OAuth 2](http://oauth.net/) for authorizing API
requests. Dropbox requires an access token to make authenticated requests.
The access token can be supplied at instantiation or set later using the
`setAccessToken()` method.

`Dropbox.getAuthenticationUrl()` is a method that is very helpful for
authenticating users. See the [authentication
example](https://github.com/dropbox/dropbox-sdk-js/blob/master/examples/javascript/auth/index.html) for a basic example of how it can be
used.

`Dropbox.authenticateWithCordova()` is a method that simplifies authentication from a Cordova / PhoneGap application. 

```javascript
var dbx = new Dropbox({ clientId: 'YOUR_CLIENT_KEY_HERE' });
dbx.authenticateWithCordova(
  function(accessToken) {        
      console.log(accessToken);
  },
  function() {        
      console.log("failed");
  });
```

The method requires the cordova inappbrowser plugin.
```console
$ cordova plugin add cordova-plugin-inappbrowser
```

For more information on how to obtain an access token using OAuth, please
see our [OAuth
Guide](https://www.dropbox.com/developers/reference/oauth-guide).

#### Promises implementation

The SDK returns Promises using the [native Promise
implementation](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
and polyfills with
[jakearchibald/es6-promise](https://github.com/stefanpenner/es6-promise)
when needed.

## Examples

See [examples/](https://github.com/dropbox/dropbox-sdk-js/tree/master/examples) for working examples of how the SDK can be used
in a few different environments.

## Versioning

We will try to follow [semver](http://semver.org/) as close as possible.
That means bug fixes will be patch releases (1.0.1 -> 1.0.2), additional
functionality like new endpoints will be minor releases (1.0.1 -> 1.1.0)
and breaking changes to both the library and the API endpoints it hits,
will be major releases (1.0.1 -> 2.0.0).
