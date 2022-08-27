const express = require("express");
const dashboard = express.Router();
const disconnect = require("clients/dropbox/disconnect");
const setup = require("./setup");
const config = require("config");
const fetch = require("node-fetch");
const Database = require("clients/dropbox/database");
const join = require("path").join;
const moment = require("moment");
const { Dropbox } = require("dropbox");
const views = __dirname + "/../views/";
const client = require("client");

dashboard.use(function loadDropboxAccount(req, res, next) {
  res.locals.partials.location = views + "location";
  Database.get(req.blog.id, function (err, account) {
    if (err) return next(err);

    if (!account) return next();

    var last_sync = account.last_sync;
    var error_code = account.error_code;

    res.locals.account = req.account = account;

    if (last_sync) {
      res.locals.account.last_sync = moment.utc(last_sync).fromNow();
    }

    if (error_code) {
      res.locals.account.folder_missing = error_code === 409;
      res.locals.account.revoked = error_code === 401;
    }

    return next();
  });
});

// The settings page for a Dropbox account
dashboard.get("/", function (req, res) {
  // Ask to user to authenticate with Dropbox if they have not yet
  if (!req.account && !req.session.dropbox) {
    var query = "";
    if (req.query.setup) query = "?setup=true";
    return res.redirect(req.baseUrl + "/setup" + query);
  }

  if (req.session.dropbox) {
    res.locals.account = req.session.dropbox;
    res.locals.preparing = true;
    // Just in case we haven't acquired the sync lock
    // the first time this page is loaded, we set the
    // state of the blog to syncing...
    if (
      res.locals.blog.status === undefined ||
      res.locals.blog.status.message === "Synced"
    ) {
      res.locals.blog.status = {
        message: "Setting up your folder on Dropbox",
        state: "syncing",
      };
    }
  }

  var dropboxBreadcrumbs = [];
  var folder;

  if (res.locals.account.folder !== undefined) {
    if (res.locals.account.full_access) {
      folder = join("Dropbox", res.locals.account.folder);
    } else {
      folder = join("Dropbox", "Apps", "Blot", res.locals.account.folder);
    }

    dropboxBreadcrumbs = folder.split("/").map(function (name) {
      return { name: name };
    });

    dropboxBreadcrumbs[dropboxBreadcrumbs.length - 1].last = true;
  }

  res.locals.dropboxBreadcrumbs = dropboxBreadcrumbs;

  res.render(views + "index");
});

// Explains to the user what will happen when they authenticate
// then provides them with a link to the dropbox redirect
dashboard.get("/setup", function (req, res) {
  res.render(views + "authenticate");
});

// Allows the user to choose a new Dropbox account to connect
// then provides them with a link to the dropbox redirect
dashboard.get("/edit", function (req, res) {
  res.render(views + "edit");
});

// Redirects the user to the OAuth page on Dropbox.com
dashboard.get("/redirect", function (req, res) {
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
});

// Explains to the user what happens when they change the
// permission they grant to Blot per access to their Dropbox
dashboard.get("/permission", function (req, res) {
  res.render(views + "permission");
});

// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
dashboard.get("/authenticate", function (req, res) {
  // the user has reloaded this page
  // if (req.session.dropbox && req.session.dropbox.preparing === true) {
  //   console.log('here, redirecting cause of session');
  //   return res.redirect(req.baseUrl);
  // }

  const { code, full_access } = req.query;
  let redirectUri =
    req.protocol + "://" + req.get("host") + "/clients/dropbox/authenticate";

  if (full_access) {
    redirectUri += "?full_access=true";
  }

  const account = {
    code,
    redirectUri,
    full_access: full_access === "true",
    preparing: true,
    blog: req.blog,
  };

  // this the first time the user has visited this page
  req.session.dropbox = account;

  setup(account, req.session, function (err) {
    console.log("err setting up", err);
  });

  res.redirect(req.baseUrl);
});

// Will remove the Dropbox account from the client's database
// and revoke the token if needed.
dashboard.get("/disconnect", function (req, res) {
  res.render(views + "disconnect");
});

dashboard.post("/disconnect", function (req, res, next) {
  client.publish(
    "sync:status:" + req.blog.id,
    "Attempting to disconnect from Dropbox"
  );
  delete req.session.dropbox;
  disconnect(req.blog.id, next);
});

module.exports = dashboard;
