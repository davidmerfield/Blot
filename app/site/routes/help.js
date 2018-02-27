var express = require('express');
var help = express.Router();
var finder = require('finder');
var moment = require('moment');

function deslug (str) {
  return str[0].toUpperCase() + str.slice(1).split('-').join(' ');
}

help.use(function(req, res, next){

  res.locals.menu = {'help': 'selected'};
  res.locals.title = 'Help';

  res.locals.date = function () {

    return function (text, render) {

      try {

        text = text.trim();
        text = moment.utc(Date.now()).format(text);

      } catch (e) {

        text = '';
      }

      if (render) return render(text);

      return text;
    };
  };

  next();
});

help.use(finder.middleware);

help.get('/account', function(req, res){
  res.locals.menu.account = 'selected';
  res.locals.title = 'Account and billing - ' + res.locals.title;
  res.special_render('account');
});

help.get(['/guides', '/guides/:guide'], function(req, res){
  res.locals.partials.yield = 'guides/' + (req.params.guide || 'index');
  res.locals.menu.guides = 'selected';
  res.locals.title = 'Guides and reference - ' + res.locals.title;
  if (req.params.guide) res.locals.title = deslug(req.params.guide) + ' - ' + res.locals.title;
  res.special_render('guides/wrapper');
});

help.get('/configuring', function(req, res){
  res.locals.menu.configuring = 'selected';
  res.locals.title = 'Configuring your blog - ' + res.locals.title;
  res.special_render('configuring');
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
  res.special_render('developers/index');
});

help.get('/developers/documentation', function(req, res){
  res.locals.menu.documentation = 'selected';
  res.locals.title = 'Developers - Documentation ' + res.locals.title;
  res.special_render('developers/documentation');
});

help.get('/developers/reference', function(req, res){
  res.locals.menu.reference = 'selected';
  res.locals.title = 'Developers - Reference ' + res.locals.title;
  res.special_render('developers/reference');
});

help.get('/developers/support', function(req, res){
  res.locals.menu.support = 'selected';
  res.locals.title = 'Developers - Support ' + res.locals.title;
  res.special_render('developers/support');
});

help.get('/getting-started', function(req, res){
  res.locals.menu.started = 'selected';
  res.locals.title = 'Getting started - ' + res.locals.title;  
  res.special_render('getting-started');
});

help.get('/', function(req, res){
  res.locals.menu.introduction = 'selected';
  res.locals.title = res.locals.title;  
  res.special_render('introduction');
});

module.exports = help;