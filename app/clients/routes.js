var dashboard = require('express').Router();
var site = require('express').Router();
var Blog = require('blog');
var list = require('./list');

function views (dir) {

  return function (req, res, next){

    res.dashboard = function(name) {
      res.renderDashboard(dir + name + '.html');
    };

    next();
  };
}

dashboard.use(views(__dirname + '/views/'));

dashboard.get('/', function (req, res) {

  if (req.blog.client)
    return res.redirect('/clients/' + req.blog.client);

  res.locals.clients = list.slice().map(function(i){
    if (i.name === req.blog.client)
      i.checked = 'checked';
    return i;
  });

  res.dashboard('index');
});

dashboard.post('/', function(req, res, next){

  var client = req.body.client;

  if (!client) return next(new Error('Please select a client'));

  Blog.set(req.blog.id, {client: client}, function(err){

    if (err) return next(err);

    res.redirect('/clients/' + client);
  });
});

var dropbox = require('./dropbox').routes;

dashboard.use('/dropbox', views(__dirname + '/dropbox/views/'));
dashboard.use('/dropbox', dropbox.dashboard);
site.use('/dropbox', dropbox.site);

module.exports = {
  site: site,
  dashboard: dashboard
};