var express = require('express');
var formatting = express.Router();

var manipulate_html = require('manipulate_html');
var finder = require('finder');
var render_tex = require('render_tex');
var render_dates = require('render_dates');
var render_markdown = require('render_markdown');
var calculate_sidebar = require('calculate_sidebar');

formatting.use(calculate_sidebar);
formatting.use(finder.middleware);
// formatting.use(manipulate_html);
// formatting.use(render_tex);
formatting.use(render_dates);
formatting.use(render_markdown);

formatting.get('/', function (req, res) {
  res.locals.menu = {'formatting': 'selected'};
  res.locals.title = 'Formatting guide for Blot';
  res.locals.partials.markdown = 'formatting-markdown';
  res.locals.partials.tex = 'formatting-tex';
  res.locals.partials.layout = 'formatting-layout';
  res.render('formatting-wrapper');
});

module.exports = formatting;