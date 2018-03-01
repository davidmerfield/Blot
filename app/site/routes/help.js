var express = require('express');
var help = express.Router();
var finder = require('finder');
var moment = require('moment');
var cheerio = require('cheerio');
var katex = require('katex');
var config = require('config');

function deslug (str) {
  return str[0].toUpperCase() + str.slice(1).split('-').join(' ');
}

function render_katex (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;
    var $ = cheerio.load(html, {decodeEntities: false});

    $('.katex').each(function(i, el){      

      $(el).replaceWith(katex.renderToString($(el).text(), {
        throwOnError: false
      }));

      $
    });

    html = $.html();

    send.call(this, html);
  };

  next();  
}

function middleware (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;
        
    var $ = cheerio.load(html, {decodeEntities: false});

    $('pre').each(function(i, el){
      
      var lang = $(el).children('code').first().attr('class');

      if (lang) lang = lang.split('lang-').join('');

      $(el).addClass(lang);
    });

    $('h2').each(function(i, el){

      var subsection_id, subsection_elements, subsection_html;

      subsection_id = $(el).attr('id') || $(el).text().split(' ').join('-').toLowerCase();
      subsection_elements = $(el).nextUntil('h2').add(el);

      $(el).removeAttr('id');

      subsection_html = '<div class="section" id="' + subsection_id + '">' + $.html(subsection_elements) + '</div>';

      $(subsection_elements)
        .before(subsection_html)
        .remove();
    });

    html = $.html();

    send.call(this, html);
  };

  next();
}

help.use(render_katex);
help.use(finder.middleware);
help.use(middleware);

var css = finder.css();

help.get('/css/finder.css', function(req, res, next){
  
  if (config.environment !== 'production') css = finder.css();

  res.contentType('text/css');
  res.send(css);
});

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
  res.render('account');
});

// help.get(['/guides', '/guides/:guide'], function(req, res){
//   res.locals.partials.yield = 'guides/' + (req.params.guide || 'index');
//   res.locals.menu.guides = 'selected';
//   res.locals.title = 'Guides and reference - ' + res.locals.title;
//   if (req.params.guide) res.locals.title = deslug(req.params.guide) + ' - ' + res.locals.title;
//   res.render('guides/wrapper');
// });

help.use('/configuring', function(req, res, next){
  res.locals.menu.configuring = 'selected';
  res.locals.title = 'Configuring your blog - ' + res.locals.title;
  next();
});

help.get('/configuring', function(req, res){
  res.render('config-index');
});


help.get('/configuring/:section', function(req, res){
  res.locals.partials.yield = 'config-' + req.params.section;
  res.locals.title = 'Configuring your blog - ' + res.locals.title;
  res.locals.section_title = 'Configuring your blog';
  res.locals.section_url = '/configuring';
  res.render('_wrapper');
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

help.use('/help', function(req, res, next){
  res.locals.menu.started = 'selected';
  res.locals.title = 'Getting started - ' + res.locals.title;  
  next();
});

help.get('/help', function(req, res){
  res.locals.menu.started = 'selected';
  res.locals.title = 'Getting started - ' + res.locals.title;  
  res.render('help-index');
});

help.get('/help/:section', function(req, res){
  res.locals.partials.yield = 'help-' + req.params.section;
  res.locals.title = 'How to use Blot - ' + res.locals.title;
  res.locals.section_title = 'How to use Blot';
  res.locals.section_url = '/help';
  res.render('_wrapper');
});

help.get('/', function(req, res){
  res.locals.menu.introduction = 'selected';
  res.locals.title = 'Blot';  
  res.render('index');
});


module.exports = help;