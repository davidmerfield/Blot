var express = require('express');
var help = express.Router();
var finder = require('finder');
var moment = require('moment');
var cheerio = require('cheerio');
var katex = require('katex');
var fs = require('fs-extra');
var view_dir = __dirname + '/../views';


// These are all the pages that fall under
// the section 'How to use Blot'
// [
//  ['dates', 'Dates'],
//  ['formatting', 'Formatting blog posts'],
//  ['images', 'Adding images to blog posts'],
//  ['metadata', 'Metadata'],
//  ['static-server', 'Static server'],
//  ['tags', 'Tags'],
//  ['teasers', 'Teasers']
// ]

function load_views (dir, prefix) {

  return fs.readdirSync(dir).filter(function(name){

    return name.indexOf(prefix) === 0;

  }).map(function(name){

    var slug = name.slice(prefix.length, name.lastIndexOf('.'));
    var content = fs.readFileSync(dir + '/' + name);
    var $ = cheerio.load(content);
    var title = $('h1').first().text();

    return {title: title, slug: slug};
  });
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

    });

    html = $.html();

    send.call(this, html);
  };

  next();  
}



function manipulate_html (req, res, next) {

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
help.use(manipulate_html);

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

help.get('/account', function(req, res){
  res.locals.menu.account = 'selected';
  res.locals.title = 'Account and billing - ' + res.locals.title;
  res.render('account');
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
  res.render('help-index');
});

load_views(view_dir, 'help-').forEach(function(section){

  help.get('/help/' + section.slug, function(req, res, next){
    res.locals.partials.yield = 'help-' + section.slug;
    res.locals.title = section.title + ' - ' + res.locals.section_title;
    res.render('_wrapper');    
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
  res.render('config-index');
});

load_views(view_dir, 'config-').forEach(function(section){

  help.get('/configuring/' + section.slug, function(req, res, next){
    res.locals.partials.yield = 'config-' + section.slug;
    res.locals.title = section.title + ' - ' + res.locals.section_title;
    res.render('_wrapper');    
  });
});



help.get('/', function(req, res){
  res.locals.menu.introduction = 'selected';
  res.locals.title = 'Blot';  
  res.locals.next = {title: 'How to use Blot', url: '/help'};
  res.render('index');
});

module.exports = help;