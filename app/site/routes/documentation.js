var express = require('express');
var Documentation = express.Router();
Documentation.get('/', function(req, res, next) {
  res.locals.partials = {
    sidebar: 'documentation/_sidebar',
    header: 'documentation/_header',
    footer: 'documentation/_footer',
    'documentation.css': 'documentation/documentation.css'
  };
  res.render('documentation/index');
});
module.exports = Documentation;