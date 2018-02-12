var express = require('express');
var router = express.Router();

var pages = [
  ['contact', 'Contact'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
  ['', 'Blot']
];

pages.forEach(function(page){

  var slug = page[0] || 'index';
  var title = page[1];

  router.get('/' + page[0], function(req, res){
    res.locals.menu = {};
    res.locals.menu[slug] = 'selected';
    res.locals.title = title;
    res.render(slug);
  });
});

module.exports = router;