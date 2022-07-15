const { Dropbox } = require("dropbox");
const config = require("config");
const fetch = require("node-fetch");

module.exports = function (req, res) {
  var redirectUri, key, secret;

  redirectUri =
    req.protocol + "://" + req.get("host") + "/clients/dropbox/authenticate";

  req.session.blogToAuthenticate = req.blog.handle;

  if (req.query.full_access) {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    redirectUri += "?full_access=true";
  } else {
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
  }

  const dbconfig = {
    fetch,
    clientId: key,
    clientSecret: secret,
  };

  const dbx = new Dropbox(dbconfig);

  // what are these mystery params
  dbx.auth
    .getAuthenticationUrl(
      redirectUri,
      null,
      "code",
      "offline",
      null,
      "none",
      false
    )
    .then((authUrl) => {
      res.writeHead(302, { Location: authUrl });
      res.end();
    });

  // res.redirect(authentication_url);
};
