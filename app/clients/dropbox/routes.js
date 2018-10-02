var debug = require("debug")("clients:dropbox:routes");
var Express = require("express");
var config = require("config");
var crypto = require("crypto");
var async = require("async");

var disconnect = require("./disconnect");
var load_dropbox_account = require("./util/load_dropbox_account");
var Database = require("./database");
var sync = require("./util/sync");

var dashboard = Express.Router();
var site = Express.Router();

dashboard
  .use(load_dropbox_account)
  .get("/", function(req, res) {
    res.render(__dirname + "/views/index.html", {
      title: "Dropbox",
      subpage_title: "Folder"
    });
  })
  .get("/permission", function(req, res) {
    res.locals.breadcrumbs.add("Permission", "change-permission");
    res.render(__dirname + "/views/permission.html", {
      title: "Dropbox",
      subpage_title: "Folder"
    });
  })
  .use("/authenticate", require("./authenticate"))
  .get("/disconnect", function(req, res) {
    res.render(__dirname + "/views/disconnect.html", {
      title: "Disconnect from Dropbox"
    });
  })
  .post("/disconnect", function(req, res, next) {
    disconnect(req.blog.id, next);
  });

// Used for testing purposes only to determine when a sync has finished
// Redlock means we can't reliably determine this just by calling
// Blot.sync();
site.get("/syncs-finished/:blogID", function(req, res) {
  res.send(finishedAllSyncs(req.params.blogID));
});

// This is called by Dropbox to verify
// the webhook is valid.
site.route("/webhook").get(function(req, res, next) {
  if (req.query && req.query.challenge) return res.send(req.query.challenge);

  return next();
});

// We keep a dictionary of synced blogs for testing
// purposes. There isn't an easy way to determine
// after pushing whether or not Blot has completed the
// sync of the blog's folder. This is because I can't
// work out how to do something asynchronous after we've
// accepted a push but before we've sent the response.
var activeSyncs = {};

function started(blogID) {
  if (activeSyncs[blogID] === undefined) activeSyncs[blogID] = 0;
  activeSyncs[blogID]++;
}

function finished(blogID) {
  activeSyncs[blogID]--;
}

function finishedAllSyncs(blogID) {
  return activeSyncs[blogID] === 0;
}

// This is called by Dropbox when changes
// are made to the folder of a Blot user.
site.route("/webhook").post(function(req, res) {
  if (config.maintenance) return res.sendStatus(503);

  var data = "";
  var accounts = [];
  var signature = req.headers["x-dropbox-signature"];
  var secret;

  if (!!req.query.full_access) {
    secret = config.dropbox.full.secret;
  } else {
    secret = config.dropbox.app.secret;
  }

  var verification = crypto.createHmac("SHA256", secret);

  req.setEncoding("utf8");

  req.on("data", function(chunk) {
    data += chunk;
    verification.update(chunk);
  });

  req.on("end", function() {
    if (signature !== verification.digest("hex")) return res.sendStatus(403);

    try {
      accounts = JSON.parse(data).list_folder.accounts;
    } catch (e) {
      return res.sendStatus(504);
    }

    // Tell Dropbox we retrieved the list of accounts
    res.sendStatus(200);

    // Sync each of the accounts!
    // accounts can be synced in parallel
    async.each(
      accounts,
      function(account_id, next_account) {
        debug("Checking blogs for Dropbox account", account_id);

        Database.listBlogs(account_id, function(err, blogs) {
          if (err) return next_account(err);

          debug("Syncing", blogs.length, "blogs");

          blogs.forEach(function(blog) {
            // Used for testing purposes only
            started(blog.id);
          });

          // blogs can be synced in parallel
          async.each(blogs, sync, function(err) {
            blogs.forEach(function(blog) {
              // Used for testing purposes only
              console.log("Finished", blog.id);
              finished(blog.id);
            });
          });
        });

        next_account();

        // Do nothing when all the accounts have synced.
      },
      function() {}
    );
  });
});

module.exports = { dashboard: dashboard, site: site };
