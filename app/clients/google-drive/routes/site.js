const _ = require("lodash");
const moment = require("moment");
const config = require("config");
const querystring = require("querystring");
const hash = require("helper/hash");
const sync = require("../sync");
const clfdate = require("helper/clfdate");
const database = require("../database");
const express = require("express");
const site = new express.Router();
const cookieParser = require("cookie-parser");

// Customers are sent back to:
// blot.im/clients/google-drive/authenticate
// when they have authorized (or declined to authorize)
// Blot's access to their folder. This is a public-facing
// route without access to the customer's session by default.
// We need to work out which blog they were
// authenticating based on a value stored in their session
// before they were sent out to Google Drive. Unfortunately we
// can't pass a blog username in the URL, since it needs to
// be the same URL every time, e.g. this would not work:
// blot.im/clients/google-drive/authenticate?handle=david

// Additionally, in development mode, we are:
// first sent back to:
// tunnel.blot.im/clients/google-drive/authenticate
// are then redirected to:
// blot.development/clients/google-drive/authenticate
// and finally redirected to:
// blot.development/dashboard/*/client/google-drive/authenticate
site.get("/authenticate", cookieParser(), function (req, res) {
  // This means we hit the public routes on Blot's site
  if (req.cookies.blogToAuthenticate) {
    const redirect =
      "/sites/" +
      req.cookies.blogToAuthenticate +
      "/client/google-drive/authenticate?" +
      querystring.stringify(req.query);

    res.clearCookie("blogToAuthenticate");
    res.send(`<html>
<head>
<meta http-equiv="refresh" content="0;URL='${redirect}'"/>
<script type="text/javascript">window.location='${redirect}'</script>
</head>
<body>
<noscript><p>Continue to <a href="${redirect}">${redirect}</a>.</p></noscript>
</body>
</html>`);
    // This means we hit the public routes on Blot's webhook
    // forwarding host (e.g. tunnel.blot.im) we don't have access
    // to the session info yet so we redirect to the public routes
    // on Blot's site, which will be able to access the session.
  } else {
    const url =
      config.protocol +
      config.host +
      "/clients/google-drive/authenticate?" +
      querystring.stringify(req.query);
    res.redirect(url);
  }
});

site
  .route("/webhook")
  .get(function (req, res) {
    res.send("Ok!");
  })
  .post(async function (req, res) {
    const prefix = () => clfdate() + " Google Drive:";
    const tokenHeader = req.header("x-goog-channel-token");
    const channelID = req.header("x-goog-channel-id");

    if (!tokenHeader) return res.status(400).send("Missing header");

    const token = querystring.parse(tokenHeader);
    const { blogID } = token;
    const signature = hash(blogID + channelID + config.session.secret);

    if (token.signature !== signature)
      return res.status(400).send("Invalid signature");

    const channel = {
      kind: "api#channel",
      id: req.header("x-goog-channel-id"),
      resourceId: req.header("x-goog-resource-id"),
      resourceUri: req.header("x-goog-resource-uri"),
      token: req.header("x-goog-channel-token"),
      expiration: moment(req.header("x-goog-channel-expiration"))
        .valueOf()
        .toString()
    };

    const account = await database.getAccount(blogID);

    // When for some reason we can't stop the old webhook
    // for this blog during an account disconnection we sometimes
    // recieve webhooks on stale channels. This can tank the setup
    // of the blog on Google Drive and happens in my dev env.
    // We can't call drive.stop on the stale channel since the
    // refresh_token likely changed, just let it expire instead.
    if (!account || !_.isEqual(channel, account.channel)) {
      return res.send("OK");
    }

    res.send("OK");

    try {
      await sync(blogID);
    } catch (err) {
      console.error(prefix(), blogID, "Error:", err);
      // folder.log("Error:", err.message);
      //    try {
      //      await reset(blogID);
      //      const blog = await getBlog({ id: blogID });
      //      await fix(blog);
      //    } catch (e) {
      //      folder.log("Error verifying folder:", e.message);
      //      return done(e, callback);
      //    }
    }
  });

module.exports = site;
