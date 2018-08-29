var express = require('express');
var router = express.Router();

var pages = [
  ['about', 'About'],
  ['contact', 'Contact'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
  ['deleted', 'Your account has been deleted'],
  ['logged-out', 'You have been logged out']

  ];

pages.forEach(function(page){

  var slug = page[0] || 'index';
  var title = page[1];

  router.get('/' + page[0], function(req, res){
    res.locals.hide_sidebar = true;
    res.locals.menu = {};
    res.locals.menu[slug] = 'selected';
    res.locals.title = title;
    res.locals.partials.yield = __dirname + '/../views/' + slug;
    res.render('_static_wrapper');
  });
});

module.exports = router;