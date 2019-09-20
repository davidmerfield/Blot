var Dropbox = require("dropbox").Dropbox;
var config = require("config");
module.exports = function(req, res) {
  var callback, key, secret, authentication_url;

  callback =
    req.protocol + "://" + req.get("host") + req.baseUrl + "/authenticate";

  if (req.query.full_access) {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    callback += "?full_access=true";
  } else {
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
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

  res.redirect(authentication_url);
};
