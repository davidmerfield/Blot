var dashboard = require('express').Router();
var database = require('./database');
var fs = require('fs-extra');
var Blog = require('blog');
var watch = require('./watch');
var config = require('config');
var join = require('path').join;

function blog_dir (blog_id) {
  return join(config.blog_folder_dir, blog_id);
}

dashboard.use(function (req, res, next){

  res.dashboard = function(name) {
    res.renderDashboard(__dirname + '/' + name + '.html');
  };

  next();
});

dashboard.get('/', function (req, res, next) {

  if (!req.blog.client) return res.redirect('/clients');

  database.get(req.blog.id, function(err, path){

    if (err) return next(err);

    var error = req.query && req.query.error;

    if (error) res.locals.error = decodeURIComponent(error);

    res.locals.path = path;

    res.dashboard('index');
  });
});

dashboard.post('/', function(req, res, next){

  database.set(req.blog.id, req.body.path, function(err){

    if (err) return next(err);

    watch(req.blog.id, req.body.path);
    res.locals.path = req.body.path;

    res.dashboard('index');
  });
});

dashboard.post('/disconnect', function(req, res, next){

  database.drop(req.blog.id, function(err){

    if (err) return next(err);

    Blog.set(req.blog.id, {client: ''}, function(err){

      if (err) return next(err);

      fs.emptyDir(blog_dir(req.blog.id), function(err){

        if (err) return next(err);

        res.redirect('/clients');
      });
    });
  });
});

module.exports = dashboard;