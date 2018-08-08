var Express = require('express');
var Documentation = new Express.Router();
var cheerio = require('cheerio');

require('fs-extra').outputFileSync(__dirname + '/views/css/finder.css', require('finder').css());

Documentation.get('/css', Express.static(__dirname + '/views/css'));


Documentation
  .use(require('./util/render_tex'))
  .use(require('./util/render_dates'))
  .use(require('finder').middleware)
  .use(require('./util/manipulate_html'))

Documentation.use(function(req, res, next){
  res.locals.partials = res.locals.partials || {};
  res.locals.partials.sidebar = __dirname + '/views/sidebar.html';
  res.locals.baseUrl = req.baseUrl;
  next();
});

Documentation.use(function(req, res, next){
  
  res.yield = function (view, locals) {
    var wrapper = (locals && locals.wrapper) || __dirname + '/views/wrapper.html';

    if (req.user) {
      wrapper = __dirname + '/views/wrapper_logged_in.html';
    }

    res.locals.partials.yield = __dirname + '/views/' + view;
    res.render(wrapper, locals);
  }

  res.locals.link = function (text, render) {
    return function(elHTML, render) {
      var $ = cheerio.load(elHTML);
      var url = req.baseUrl + $('a').attr('href');
      
      if (url === req.originalUrl) {
        $('a').addClass('selected');
      }

      $('a').attr('href', url);

      return $.html();
    }
  }

  next();
});


Documentation.route("/")
  .get(function(req, res, next){
    console.log('HERE');
    res.yield('index', {title: 'Getting started'});
  });

Documentation.get("/metadata", function(req, res, next){
  res.yield('metadata', {title: 'Metadata'});
});

Documentation.get("/metadata/dates", function(req, res, next){
  res.yield('metadata-dates', {title: 'Dates'});
});

Documentation.get("/metadata/tags", function(req, res, next){
  res.yield('metadata-tags');
});

Documentation.get("/folder", function(req, res, next){
  res.yield('folder');
});


Documentation.get("/configuring", function(req, res, next){
  res.yield('configuring');
});

Documentation.get("/account", function(req, res, next){
  res.yield('account');
});

Documentation.get("/domain", function(req, res, next){
  res.yield('domain');
});

Documentation.get("/urls", function(req, res, next){
  res.yield('urls');
});

Documentation.get("/dashboard", function(req, res, next){
  res.yield('dashboard');
});

Documentation.get("/formatting", function(req, res, next){
  res.yield('formatting');
});


module.exports = Documentation;