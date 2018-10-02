// Look at all this bullshit. Unbelieveable.
// Great job, folks at Dropbox. Proud of you.

var fetch = require("isomorphic-fetch");
var Dropbox = require("dropbox").Dropbox;

// Literally copied this from the readme of their
// SDK repo. Unbelieveable. These people have no taste.
// Working with this SDK filled me with rage.

module.exports = function(token) {
  return new Dropbox({
    accessToken: token,
    fetch: fetch
  });
};
