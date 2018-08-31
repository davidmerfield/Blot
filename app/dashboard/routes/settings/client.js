var clients = require("clients");

var express = require("express");
var client_routes = express.Router();

var Blog = require("blog");
var load = require("./load");

// So the breadcrumbs look like: Settings > Client
client_routes.use(function(req, res, next) {
  res.locals.breadcrumbs.add("Client", "client");
  next();
});

client_routes

  .route("/")

  .get(load.clients, load.client, function(req, res) {
    res.render("clients", { title: "Select a client" });
  })

  .post(function(req, res, next) {
    if (!req.body.client) {
      return next(new Error("Please select a client"));
    }

    if (clients[req.body.client] === undefined) {
      return next(new Error("Please select a client"));
    }

    Blog.set(req.blog.id, { client: req.body.client }, function(err) {
      if (err) return next(err);

      res.redirect(req.baseUrl + "/" + req.body.client);
    });
  });

for (var client_name in clients) {
  var client = clients[client_name];

  if (!client.dashboard_routes) continue;

  client_routes.use(
    "/" + client.name,
    check_this_client_is_selected(client_name),
    addCrumb(client.display_name, client_name),
    client.dashboard_routes
  );
}

function addCrumb(display_name, client_name) {
  return function(req, res, next) {
    res.locals.base = req.baseUrl;

    // res.locals.breadcrumbs.add(display_name, client_name);
    next();
  };
}

function check_this_client_is_selected(client_name) {
  return function(req, res, next) {
    var redirect;

    if (req.blog.client === client_name) return next();

    redirect = req.baseUrl;

    if (req.blog.client) {
      redirect += "/" + req.blog.client;
    }

    res.redirect(redirect);
  };
}

module.exports = client_routes;
