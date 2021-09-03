const config = require("config");
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

// Dropbox makes this way harder than it needs to be
module.exports = function (req, res, next) {
  let key, secret;
  let redirectUri =
    req.protocol + "://" + req.get("host") + req.baseUrl + "/authenticate";

  if (req.query.full_access) {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    redirectUri += "?full_access=true";
  } else {
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
  }

  const dbx = new Dropbox({
    fetch,
    clientId: key,
    clientSecret: secret,
  });

  const { code } = req.query;

  dbx.auth
    .getAccessTokenFromCode(redirectUri, code)
    .then((response) => {
      req.access_token = response.result.access_token;
      req.refresh_token = response.result.refresh_token;
      next();
    })
    .catch(next);
};
