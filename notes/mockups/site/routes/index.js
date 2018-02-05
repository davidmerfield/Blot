var express = require('express');
var site = express.Router();

var pages = [
  ['about', 'About'],
  ['contact', 'Contact'],
  ['sign-up', 'Sign up'],
  ['log-in', 'Log in'],
  ['help', 'Help'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
  ['updates', 'Updates'],
  ['', 'Home']
];

pages.forEach(function(page){

  var slug = page[0];
  var title = page[1];

  site.get('/' + slug, function(req, res){
    res.locals.menu = {};
    res.locals.menu[slug || 'index'] = 'selected';
    res.locals.title = res.locals.version + ': Blot ' + title;
    res.renders(slug || 'index');
  });

});

module.exports = site;