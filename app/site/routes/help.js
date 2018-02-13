var express = require('express');
var help = express.Router();
var finder = require('finder');

help.use(finder.middleware);

help.use(function(req, res, next){
  res.locals.menu = {'help': 'selected'};
  next();
});

help.get('/account', function(req, res){
  res.locals.menu.account = 'selected';
  res.special_render('help/account');
});

help.get(['/guides', '/guides/:guide'], function(req, res){
  res.locals.partials.yield = 'help/guides/' + (req.params.guide || 'index');
  res.locals.menu.guides = 'selected';
  res.special_render('help/guides/wrapper');
});

help.get('/templates', function(req, res){
  res.locals.menu.templates = 'selected';
  res.special_render('help/templates');
});

help.get('/', function(req, res){
  res.locals.menu.started = 'selected';
  res.special_render('help/getting-started');
});

module.exports = help;