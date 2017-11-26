var client_routes = require('express').Router();
var Blog = require('blog');
var clients = require('clients');
var list = [];

// Build the list of clients for the dashboard
for (var i in clients) {
  list.push({
    name: i,
    display_name: clients[i].display_name,
    description: clients[i].description
  });
}

module.exports = function (dashboard) {

  client_routes.use(function(req, res, next){
    res.locals.tab = {folder: 'selected'};
    next();
  });

  client_routes.get('/', function (req, res) {

    if (req.blog.client) return res.redirect('/clients/' + req.blog.client);

    res.locals.clients = list.slice();
    res.locals.clients[0].checked = 'checked';

    res.renderDashboard('clients');
  });

  client_routes.post('/', function(req, res, next){

    var client = req.body.client;

    if (!client) return next(new Error('Please select a client'));

    Blog.set(req.blog.id, {client: client}, function(err){

      if (err) return next(err);

      res.redirect('/clients/' + client);
    });
  });

  for (var i in clients) {

    var client = clients[i];

    if (client.dashboard_routes)
      client_routes.use('/' + client.name, client.dashboard_routes);

  }

  dashboard.use('/clients', client_routes);
};