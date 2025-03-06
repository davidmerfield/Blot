const clients = require("clients");
const _ = require("lodash");
const moment = require("moment");
const express = require("express");
const client_routes = express.Router();
const Path = require("path");
const Blog = require("models/blog");
const load = require("./load");
const Sync = require("sync");
const Fix = require("sync/fix");
const Rebuild = require("sync/rebuild");
const parse = require("dashboard/util/parse");

const { promisify } = require("util");
const getStatuses = promisify(Blog.getStatuses);

// So the breadcrumbs look like: Settings > Client
client_routes.use(function (req, res, next) {
  res.locals.breadcrumbs.add("Folder", "client");
  next();
});

client_routes.use(load.client);

client_routes

  .route("/switch")

  .get(load.clients, function (req, res) {
    res.locals.breadcrumbs.add("Switch", "switch");
    res.render("dashboard/clients/switch", {
      title: "Switch to another client"
    });
  })

  .post(parse, function (req, res, next) {
    const redirect = req.baseUrl + "/" + req.body.client;

    if (!req.body.client) {
      return next(new Error("Please select a client"));
    }

    if (req.body.client === req.blog.client) return res.redirect(redirect);

    clients[req.blog.client].disconnect(req.blog.id, function (err) {
      if (err) return next(err);
      Blog.set(req.blog.id, { client: req.body.client }, function (err) {
        if (err) return next(err);

        res.redirect(redirect);
      });
    });
  });

// Used to change tense of activity on dashboard
// and to help parse paths from status messages
const verbs = {
  Downloading: "downloaded",
  Syncing: "synced",
  Transferring: "transferred",
  Removing: "removed"
};

client_routes.route("/activity").get(load.clients, async function (req, res) {
  res.locals.breadcrumbs.add("Activity", "activity");

  let { statuses, next, previous } = await getStatuses(req.blog.id);

  statuses = _.chain(statuses)
    .groupBy("syncID")
    .map((value, key) => ({
      syncID: key,
      messages: value
        .map(item => {
          const matchedVerb = Object.keys(verbs).find(i =>
            item.message.startsWith(i + " /")
          );

          if (matchedVerb) {
            const path = item.message.slice((matchedVerb + " ").length);
            item.path = Path.parse(path);
            item.verb = verbs[matchedVerb];
            item.url = Path.join(
              res.locals.base,
              "folder",
              encodeURIComponent(path.slice(1))
            );
          }

          item.fromNow = moment(item.datestamp).fromNow();

          return item;
        })
        .filter(({ message }) => message !== "Syncing" && message !== "Synced")
    }))
    .filter(i => i.messages && i.messages.length)
    .value();

  res.render("dashboard/clients/activity", {
    title: "Activity",
    statuses,
    next,
    previous
  });
});

client_routes

  .route("/reset")

  .get(load.client, function (req, res) {
    res.locals.breadcrumbs.add("Reset", "reset");
    res.render("dashboard/clients/reset", {
      title: "Reset your folder"
    });
  });

client_routes.post("/reset/rebuild", function (req, res) {
  Sync(req.blog.id, function (err, folder, done) {
    if (err) {
      return res.message(
        res.locals.base + "/client/reset",
        new Error("Failed to rebuild folder since it is syncing")
      );
    }

    res.message(
      res.locals.base + "/client/reset",
      "Begin rebuild of your site"
    );

    folder.status("Rebuilding your site");

    const thumbnails = !!req.query.thumbnails;
    const imageCache = !!req.query.imageCache;

    Rebuild(req.blog.id, { thumbnails, imageCache }, function (err) {
      if (err) console.log(err);
      folder.status("Checking your site for issues");
      Fix(req.blog, function (err) {
        if (err) console.log(err);
        folder.status("Finished site rebuild");
        done(null, function (err) {
          if (err) console.log("Error releasing sync: ", err);
        });
      });
    });
  });
});

client_routes.post("/reset/resync", load.client, function (req, res, next) {
  if (!res.locals.client.resync)
    return next(new Error("Cannot resync using your current client"));

  Sync(req.blog.id, async function (err, folder, done) {
    if (err) {
      return res.message(
        res.locals.base + "/client/reset",
        new Error("Failed to resync folder since it is syncing")
      );
    }

    res.message(res.locals.base + "/client/reset", "Begin resync of your site");

    try {
      await res.locals.client.resync(req.blog.id, folder.status);
    } catch (err) {
      console.log("ERROR:", err);
    }

    Rebuild(req.blog.id, function (err) {
      if (err) console.log(err);
      folder.status("Checking your site for issues");
      Fix(req.blog, function (err) {
        if (err) console.log(err);
        folder.status("Finished site rebuild");

        done(null, function (err) {
          if (err) console.log(err);
        });
      });
    });
  });
});

client_routes
  .route("/")

  .get(load.clients, function (req, res) {
    if (req.blog.client) {
      return res.redirect(req.baseUrl + "/" + req.blog.client);
    } 

    res.render("dashboard/clients", { title: "Select a client" });
  })

  .post(parse, function (req, res, next) {
    let redirect;

    if (!req.body.client) {
      return next(new Error("Please select a client"));
    }

    if (clients[req.body.client] === undefined) {
      return next(new Error("Please select a client"));
    }

    redirect = req.baseUrl + "/" + req.body.client;

    Blog.set(req.blog.id, { client: req.body.client }, function (err) {
      if (err) return next(err);
      res.redirect(redirect);
    });
  });

client_routes.use("/:client", function (req, res, next) {
  if (!req.blog.client) {
    return res.redirect(res.locals.base + "/client");
  }

  if (req.params.client !== req.blog.client) {
    return res.redirect(res.locals.base + "/client/" + req.blog.client);
  }
  res.locals.dashboardBase = res.locals.base;
  res.locals.base = req.baseUrl;

  next();
});

for (let client_name in clients) {
  const client = clients[client_name];

  if (!client.dashboard_routes) continue;

  client_routes.use("/" + client.name, client.dashboard_routes);
}

client_routes.use("/:client", (req, res) => {
  res.redirect(`/sites/${req.blog.handle}/client`);
});

module.exports = client_routes;
