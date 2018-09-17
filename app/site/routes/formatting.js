var express = require('express');
var formatting = express.Router();

var manipulate_html = require('./util/manipulate_html');
var finder = require('finder');
var render_tex = require('./util/render_tex');
var render_dates = require('./util/render_dates');
var render_markdown = require('./util/render_markdown');
var calculate_sidebar = require('./util/calculate_sidebar');

formatting.use(calculate_sidebar);
formatting.use(finder.middleware);
formatting.use(render_tex);
formatting.use(render_dates);
formatting.use(render_markdown);

formatting.get('/', function (req, res) {
  res.locals.menu = {'formatting': 'selected'};
  res.locals.title = 'Formatting guide for Blot';
  res.locals.partials.sidebar = __dirname + '/../views/formatting-sidebar';
  res.locals.partials.markdown = __dirname + '/../views/formatting-markdown';
  res.locals.partials.tex = __dirname + '/../views/formatting-tex';
  res.locals.partials.layout = __dirname + '/../views/formatting-layout';
  res.locals.partials.yield = __dirname + '/../views/formatting-wrapper'
  res.render('_static_wrapper');
});

module.exports = formatting;