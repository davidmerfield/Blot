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
  res.special_render('help/account');
});

help.get(['/guides', '/guides/:guide'], function(req, res){
  res.locals.partials.yield = 'help/guides/' + (req.params.guide || 'index');
  res.locals.menu.guides = 'selected';
  res.locals.title = 'Guides and reference - ' + res.locals.title;
  if (req.params.guide) res.locals.title = deslug(req.params.guide) + ' - ' + res.locals.title;
  res.special_render('help/guides/wrapper');
});

help.get('/templates', function(req, res){
  res.locals.menu.templates = 'selected';
  res.locals.title = 'Designing templates - ' + res.locals.title;
  res.special_render('help/templates');
});

help.get('/', function(req, res){
  res.locals.menu.started = 'selected';
  res.locals.title = 'Getting started - ' + res.locals.title;  
  res.special_render('help/getting-started');
});

module.exports = help;