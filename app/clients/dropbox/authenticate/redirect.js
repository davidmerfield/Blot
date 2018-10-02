var debug = require("debug")("clients:dropbox:authenticate");
var config = require("config");
var Dropbox = require("dropbox");
var callback_uri = require("./callback_uri");

module.exports = function(req, res) {
  var callback, key, secret, authentication_url;

  if (req.query.full_access) {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    callback = callback_uri(req) + "?full_access=true";
  } else {
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
    callback = callback_uri(req);
  }

  var client = new Dropbox({
    clientId: key,
    secret: secret
  });

  authentication_url = client.getAuthenticationUrl(callback, null, "code");
  authentication_url = authentication_url.replace(
    "response_type=token",
    "response_type=code"
  );

  debug("Redirecting", req.blog.id, "authentication_url");

  res.redirect(authentication_url);
};
