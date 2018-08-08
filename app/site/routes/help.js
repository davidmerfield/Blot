var finder = require('finder');
var express = require('express');
var load_views = require('load_views');
var render_tex = require('render_tex');
var render_dates = require('render_dates');
var manipulate_html = require('manipulate_html');
var sites = require('./sites');

var help = express.Router();
var VIEW_DIR = require('VIEW_DIR');

help.use(render_tex);
help.use(render_dates);
help.use(finder.middleware);
help.use(manipulate_html);

help.use(function(req, res, next){
  res.locals.menu = {'help': 'selected'};
  res.locals.title = 'Help';
  next();
});

help.get('/help/account', function(req, res){
  res.locals.menu.account = 'selected';
  res.locals.title = 'Account and billing - ' + res.locals.title;
  res.locals.partials.yield = __dirname + '/../views/account';
  res.render('_static_wrapper');    
});

help.use('/developers', function(req, res, next){
  res.locals.menu.developers = 'selected';
  res.locals.menu.help = '';
  res.locals.dark = 'dark';
  next();
});

help.get('/developers', function(req, res){
  res.locals.menu.index = 'selected';
  res.locals.title = 'Developers - ' + res.locals.title;
  res.render('dev-index');
});

help.get('/developers/documentation', function(req, res){
  res.locals.menu.documentation = 'selected';
  res.locals.title = 'Developers - Documentation ' + res.locals.title;
  res.render('dev-documentation');
});

help.get('/developers/reference', function(req, res){
  res.locals.menu.reference = 'selected';
  res.locals.title = 'Developers - Reference ' + res.locals.title;
  res.render('dev-reference');
});

help.get('/developers/support', function(req, res){
  res.locals.menu.support = 'selected';
  res.locals.title = 'Developers - Support ' + res.locals.title;
  res.render('dev-support');
});


// How to use Blot

help.use('/help', function(req, res, next){
  res.locals.menu.started = 'selected';
  res.locals.title = res.locals.section_title = 'How to use Blot';
  res.locals.section_url = '/help';  
  next();
});

help.get('/help', function(req, res){
  res.locals.next = {title: 'Configuring your blog', url: '/configuring'};  
  res.locals.partials.yield = __dirname + '/../views/help-index';
  res.render('_static_wrapper');
});

load_views(VIEW_DIR, 'help-').forEach(function(section){

  help.get('/help/' + section.slug, function(req, res){
    res.locals.title = section.title + ' - ' + res.locals.section_title;
    res.locals.partials.yield = __dirname + '/../views/help-' + section.slug;
    res.render('_static_wrapper');    
  });
});


// Configuring yoru blog


help.use('/configuring', function(req, res, next){
  res.locals.menu.config = 'selected';
  res.locals.title = res.locals.section_title = 'Configuring your blog';
  res.locals.section_url = '/configuring';  
  next();
});

help.get('/configuring', function(req, res){
  res.locals.next = {title: 'Account and billing', url: '/account'};  
  res.locals.partials.yield = __dirname + '/../views/config-index';
  res.render('_static_wrapper');  
});

load_views(VIEW_DIR, 'config-').forEach(function(section){

  help.get('/configuring/' + section.slug, function(req, res){
    res.locals.partials.yield = __dirname + '/../views/config-' + section.slug;
    res.locals.title = section.title + ' - ' + res.locals.section_title;
    res.render('_static_wrapper');    
  });
});


help.get('/', function(req, res){
  
  sites(function(err, sites){

    if (err) return next(err);

    res.locals.menu.introduction = 'selected';
    res.locals.title = 'Blot';  
    res.locals.next = {title: 'How to use Blot', url: '/help'};
    res.locals.sites = sites;
    res.render('index');
  });

});

module.exports = help;