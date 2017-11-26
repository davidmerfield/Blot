var helper = require('helper');
var express = require('express');
var hogan = require('hogan-express');
var site = express();
var middleware = require('middleware');
var add = middleware.add;
var config = require('config');
var hogan = require('hogan-express');
var compression = require('compression');

var MAP = {
  '/apps': '/plugins',
  '/cancel': '/account/cancel',
  '/update-billing': '/account/update-billing',
  '/logout': '/account/log-out',
  '/account/logout': '/account/log-out',
  '/create-blog': '/account/create-blog',
  '/settings': '/preferences',
  '/settings/404s': '/404s',
  '/settings/design': '/theme',
  '/settings/design/new': '/theme/new',
  '/settings/redirects': '/preferences',
  '/settings/typography': '/preferences',
  '/settings/images': '/preferences',
  '/settings/add-ons': '/preferences'
};


site
  .use(middleware.forceSSL)
  .use(compression())

  // The disable('x-powered-by')
  // and use(compression()) must
  // be specified for each individual
  // app. Express considers each seperately.
  .disable('x-powered-by')

  .set('trust proxy', 'loopback')
  .set('view engine', 'html')
  .set('views', __dirname + '/views')
  .engine('html', hogan)

  .use(add())

  // The default partials are for
  // logged out users When we
  // check authentication we swap
  // these for the logged-in.
  .use(function(req, res, next){

    delete res.locals.partials;

    res.locals.partials = {
      head: '_head',
      header: '_header',
      footer: '_footer'
    };

    if (req.user) res.locals.partials.header = '_header_user';

    next();
  });


// The order of this shit is important
// I've disabled the cache on the main
// site for now. In future, add .use(cache.middleware());

// For when we want to cache templates
if (config.environment !== 'development')
  site.enable('view cache');


if (config.maintenance) {

  site.use('/sign-up', function(req, res){

    res.redirect('/maintenance');
  });
}

// Define these individually don't
// overwrite server.locals
site.locals.protocol = config.protocol;
site.locals.host = config.host;
site.locals.title = 'Blot';
site.locals.cacheID = Date.now();

site.use(['/sign-up*', '/log-in*', '/set-password*'], function(req, res, next){

  if (!req.session || !req.session.uid) return next();

  var redirect = req.query && req.query.then;

  res.redirect(redirect || '/');
});

require('./routes/clients')(site);
require('./routes/help')(site);
require('./routes/static')(site);
require('./routes/changes')(site);
require('./routes/webhook')(site);

site.use('/sign-up', require('./routes/sign-up'));
site.use('/log-in', require('./routes/log-in'));

var routes = [];

// Determine dashboard apps for redirector
// this should only be routes for get requests...
// it causes an infinite loop for route spec which
// matches /account* but not a specific route.
require('../dashboard')._router.stack.forEach(function(middleware){

  // routes registered directly on the app
  if (middleware.route) {

    if (helper.type(middleware.route.path, 'array'))
      return middleware.route.path.forEach(function(path){routes.push(path)});

    return routes.push(middleware.route.path);
  }

  // router middleware
  if (middleware.name === 'router')
    middleware.handle.stack.forEach(function(handler){
      if (handler.route) routes.push(handler.route.path);
    });

});

// Redirect old routes
site.use(function(req, res, next){

  if (!MAP[req.path]) return next();

  res.redirect(MAP[req.path]);
});

// Redirect dashboard routes
site.get(routes, function(req, res, next){
  console.log('redirecting here.....', req.url);
  res.redirect('/log-in?then=' + req.url);
});

require('./routes/error')(site);

module.exports = site;