var config = require("config");
var https = require("https");

// Dropbox makes this way harder than it needs to be
module.exports = function(req, res, next) {
  var key, secret, url, redirect_uri, request, response;
  
  // Does this happen if the user denies permission?
  if (!req.query || !req.query.code) {
    return next(new Error("No code from Dropbox"));
  }

  redirect_uri = req.protocol + "://" + req.get("host") + req.baseUrl;

  // The user followed the authentication flow to
  // grant permission to their entire Dropbox or
  // an app folder. We have different 'Apps' for each
  // scenario so in order to retrieve the access token
  // for the user, we need to know which app is in action.
  if (req.query.full_access === "true") {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    redirect_uri += "?full_access=true";
  } else {
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
  }

  url = {
    hostname: "api.dropboxapi.com",
    headers: {
      Authorization:
        "Basic " + new Buffer(key + ":" + secret).toString("base64")
    },
    method: "POST",
    path:
      "/oauth2/token?code=" +
      req.query.code +
      "&grant_type=authorization_code&redirect_uri=" +
      redirect_uri
  };

  request = https.request(url, function(data) {
    response = "";

    data.on("data", function(chunk) {
      response += chunk;
    });

    data.on("end", function() {
      try {
        response = JSON.parse(response);
      } catch (err) {
        return next(err);
      }

      req.token = response.access_token;
      next();
    });
  });

  request.on("error", next);

  request.end();
};
