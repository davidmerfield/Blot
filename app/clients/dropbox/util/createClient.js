// This exists because requiring fetch
// and doing Dropbox.Dropbox is too upsetting
// in every single file. I wrap the constructor.

var fetch = require("isomorphic-fetch");
var Dropbox = require("dropbox").Dropbox;

module.exports = function(token) {
  return new Dropbox({
    accessToken: token,
    fetch: fetch
  });
};
