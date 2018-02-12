var express = require('express');
var help = express.Router();

help.use(function(req, res, next){
  res.locals.menu = {'help': 'selected'};
  next();
});

help.get('/account', function(req, res){
  res.locals.menu.account = 'selected';
  res.render('help/account');
});

help.get(['/guides', '/guides/:guide'], function(req, res){

  // We wouldn't need to do this bullshit
  // if the template rendering library had
  // some sensible way to add an additional
  // partial for a given request.

  // Shallow copy the global app partials, then
  // append the specific content to populate
  // the general layout for the guides pages
  res.locals.partials.yield = 'help/guides/' + (req.params.guide || 'index');
  res.locals.menu.guides = 'selected';
  res.render('help/guides/wrapper');
});

help.get('/templates', function(req, res){
  res.locals.menu.templates = 'selected';
  res.render('help/templates');
});

help.get('/', function(req, res){
  res.locals.menu.started = 'selected';
  res.render('help/getting-started');
});

module.exports = help;