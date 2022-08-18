// Customers are sent back to:
// blot.im/clients/dropbox/authenticate
// when they have authorized (or declined to authorize)
// Blot's access to their folder. This is a public-facing
// route without access to the customer's session by default.
// We need to work out which blog they were
// authenticating based on a value stored in their session
// before they were sent out to Dropbox. Unfortunately we
// can't pass a blog username in the URL, since it needs to
// be the same URL every time, e.g. this would not work:
// blot.im/clients/dropbox/authenticate?handle=david
const express = require("express");
const session = require("dashboard/session");
const authenticate = express.Router();

authenticate.get("/", session, function (req, res, next) {
  const handle = req.session.blogToAuthenticate;
  if (!handle) return next(new Error("No blog to authenticate"));
  delete req.session.blogToAuthenticate;
  let redirect =
    "/dashboard/" +
    handle +
    "/client/dropbox/authenticate?code=" +
    req.query.code;

  if (req.query.full_access) redirect += "&full_access=true";

  res.redirect(redirect);
});

module.exports = authenticate;
