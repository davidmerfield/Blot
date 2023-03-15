const clients = require("clients");
const _ = require("lodash");
const moment = require("moment");
const express = require("express");
const client_routes = express.Router();

const Blog = require("blog");
const load = require("./load");
const Sync = require("sync");
const Fix = require("sync/fix");
const Rebuild = require("sync/rebuild");

const { promisify } = require("util");
const getStatuses = promisify(Blog.getStatuses);

// So the breadcrumbs look like: Settings > Client
client_routes.use(function (req, res, next) {
  res.locals.breadcrumbs.add("Folder", "client");
  res.locals.partials["status-line"] = "clients/status-line";
  res.locals.partials["disconnect-line"] = "clients/disconnect-line";
  next();
});

client_routes.use(load.client);

client_routes

  .route("/switch")

  .get(load.clients, function (req, res) {
    res.locals.breadcrumbs.add("Switch", "switch");
    res.render("clients/switch", {
      title: "Switch to another client",
    });
  })

  .post(function (req, res, next) {
    var redirect = req.baseUrl + "/" + req.body.client;

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

client_routes.route("/activity").get(load.clients, async function (req, res) {
  res.locals.breadcrumbs.add("Activity", "activity");

  let { statuses, next, previous } = await getStatuses(req.blog.id);

  statuses = _.chain(statuses)
    .groupBy("syncID")
    .map((value, key) => ({
      syncID: key,
      messages: value
        .map((item) => {
          item.fromNow = moment(item.datestamp).fromNow();
          item.path = item.message.startsWith("Syncing /")
            ? item.message.slice("Syncing ".length)
            : "";
          item.url = require("path").join(
            res.locals.base,
            "folder",
            encodeURIComponent(item.path.slice(1))
          );
          item.path =
            item.path || item.message.startsWith("Transferring /")
              ? item.message.slice("Transferring ".length)
              : "";

          item.verb = item.message.startsWith("Transferring /")
            ? "Transferred"
            : "";
          item.verb =
            item.verb || item.message.startsWith("Syncing /") ? "Synced" : "";

          item.path = item.path ? require("path").parse(item.path) : "";
          return item;
        })
        .filter(({ message }) => message !== "Syncing" && message !== "Synced"),
    }))
    .filter((i) => i.messages && i.messages.length)
    .value();

  res.render("clients/activity", {
    title: "Activity",
    statuses,
    next,
    previous,
  });
});

client_routes

  .route("/reset")

  .get(load.client, function (req, res) {
    res.locals.breadcrumbs.add("Reset", "reset");
    res.render("clients/reset", {
      title: "Reset your folder",
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

client_routes.post("/reset/resync", function (req, res) {
  Sync(req.blog.id, function (err, folder, done) {
    if (err) {
      return res.message(
        res.locals.base + "/client/reset",
        new Error("Failed to resync folder since it is syncing")
      );
    }

    res.message(res.locals.base + "/client/reset", "Begin resync of your site");
    done(null, function (err) {
      if (err) console.log(err);
    });
  });
});

client_routes
  .route("/")

  .get(
    load.clients,
    function (req, res, next) {
      if (!req.blog.client) return next();
      res.redirect(req.baseUrl + "/" + req.blog.client);
    },
    function (req, res) {
      res.render("clients", { title: "Select a client", setup_client: true });
    }
  )

  .post(function (req, res, next) {
    var redirect;

    if (!req.body.client) {
      return next(new Error("Please select a client"));
    }

    if (clients[req.body.client] === undefined) {
      return next(new Error("Please select a client"));
    }

    redirect = req.baseUrl + "/" + req.body.client;

    if (req.body.setup) {
      redirect += "?setup=true";
    }

    Blog.set(req.blog.id, { client: req.body.client }, function (err) {
      if (err) return next(err);

      res.redirect(redirect);
    });
  });

client_routes.use("/:client", function (req, res, next) {
  if (!req.blog.client) {
    return res.redirect("/settings/client");
  }

  if (req.params.client !== req.blog.client) {
    return res.redirect(req.baseUrl + "/" + req.blog.client);
  }

  res.locals.dashboardBase = res.locals.base;
  res.locals.base = req.baseUrl;

  next();
});

for (var client_name in clients) {
  var client = clients[client_name];

  if (!client.dashboard_routes) continue;

  client_routes.use("/" + client.name, client.dashboard_routes);
}

client_routes.use("/:client", (req, res) => {
  res.redirect(`/dashboard/${req.blog.handle}/client`);
});

module.exports = client_routes;
