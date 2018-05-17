var Blog = require('blog');
var database = require('../database');
var router = require('express').Router();
var disconnect = router.route('/');

disconnect.get(function(req, res) {

  if (!req.account) return res.redirect(req.baseUrl);

  res.dashboard('disconnect');
});

disconnect.post(function(req, res, next){

  database.drop(req.blog.id, function(err){

    if (err) return next(err);

    Blog.set(req.blog.id, {client: ''}, function(err){

      if (err) return next(err);

      res.redirect('/clients');
    });
  });
});

module.exports = router;
