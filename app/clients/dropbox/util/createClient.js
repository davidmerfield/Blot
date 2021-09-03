// This exists because requiring fetch
// and doing Dropbox.Dropbox is too upsetting
// in every single file. I wrap the constructor.

var fetch = require("isomorphic-fetch");
var Dropbox = require("dropbox").Dropbox;

module.exports = function (token, refreshToken) {
  let dbconfig = {
    accessToken: token,
    fetch: fetch,
  };

  if (refreshToken) dbconfig.refreshToken = refreshToken;

  return new Dropbox(dbconfig);
};
