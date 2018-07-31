var clients = require("clients");
var client_routes = require("express").Router();
var Blog = require("blog");
var loadClients = require("./loadClients");

function check_this_client_is_selected(client_name) {
  return function(req, res, next) {
    var redirect;

    if (req.blog.client === client_name) return next();

    redirect = "/clients";

    if (req.blog.client) {
      redirect += "/" + req.blog.client;
    }

    res.redirect(redirect);
  };
}

module.exports = function(dashboard) {
  client_routes.get("/", loadClients, function(req, res, next) {
    if (req.blog.client) {
      return res.redirect("/clients/" + req.blog.client);
    }

    res.render("clients");
  });

  client_routes.post("/", function(req, res, next) {
    if (!req.body.client) {
      return next(new Error("Please select a client"));
    }

    if (clients[req.body.client] === undefined) {
      return next(new Error("Please select a client"));
    }

    Blog.set(req.blog.id, { client: req.body.client }, function(err) {
      if (err) return next(err);

      res.redirect("/clients/" + req.body.client);
    });
  });

  for (var client_name in clients) {
    var client = clients[client_name];

    if (!client.dashboard_routes) continue;

    client_routes.use(
      "/" + client.name,
      check_this_client_is_selected(client_name)
    );
    client_routes.use("/" + client.name, client.dashboard_routes);
  }

  dashboard.use("/clients", client_routes);
};
