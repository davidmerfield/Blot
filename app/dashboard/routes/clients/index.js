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

function check_this_client_is_selected (client_name){
  
  return function (req, res, next) {

    var redirect;
    
    if (req.blog.client === client_name) return next();

    redirect = '/clients';

    if (req.blog.client) {
      redirect += '/' + req.blog.client;
    }

    res.redirect(redirect);
  };
}

module.exports = function (dashboard) {

  client_routes.use(function(req, res, next){
    res.locals.tab = {folder: 'selected'};
    next();
  });

  client_routes.get('/', function (req, res, next) {

    if (req.blog.client) return res.redirect('/clients/' + req.blog.client);

    if (list.length === 1) {

      var client = list[0].name;

      return Blog.set(req.blog.id, {client: client}, function(err){

        if (err) return next(err);

        res.redirect('/clients/' + client);
      });
    }

    res.locals.clients = list.slice();

    // if (req.user.id !== 'user_5NU6PZX5RH0' && req.user.id !== 'user_FZRFM1D34R5') {
    //   res.locals.clients = res.locals.clients.filter(function(client){
    //     return client.name !== 'git';
    //   });
    // }

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

  for (var client_name in clients) {

    var client = clients[client_name];

    if (!client.dashboard_routes) continue;

    client_routes.use('/' + client.name, check_this_client_is_selected(client_name));
    client_routes.use('/' + client.name, client.dashboard_routes);
  }

  dashboard.use('/clients', client_routes);
};