// Look at all this bullshit. Unbelieveable.
// Great job, folks at Dropbox. Proud of you.
// Literally copied this from the readme of their
// SDK repo. Unbelieveable. Working with this SDK
// filled me with rage.

var fetch = require("isomorphic-fetch");
var Dropbox = require("dropbox").Dropbox;

module.exports = function(token) {
  return new Dropbox({
    accessToken: token,
    fetch: fetch
  });
};
