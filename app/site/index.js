var config = require('config');
var express = require('express');
var hogan = require('hogan-express');
var compression = require('compression');
var middleware = require('middleware');

var routes = require('./routes');
var views = __dirname + '/views';
var static = __dirname + '/static';

// The express application which serves
// the public-facing website.
var site = express();

// Define these individually don't
// overwrite server.locals
site.locals.title = 'Blot';
site.locals.host = config.host;
site.locals.cacheID = Date.now();
site.locals.protocol = config.protocol;
site.locals.price = '$' + config.stripe.plan.slice(-2);

var views = __dirname + '/views/';
var dashboard_views = require('helper').rootDir + '/app/dashboard/views/partials/'
site.use(function (req, res, next) {

  if (!req.user) {

    res.locals.partials = {
      head: views + '_head',
      header: views + '_header',
      sidebar: views + '_sidebar',
      footer: views + '_footer'
    }

  } else {

    res.locals.partials.head = dashboard_views + 'head';
    res.locals.partials.header = dashboard_views + 'header';
    res.locals.partials.nav = dashboard_views + 'nav';
    res.locals.partials.sidebar = views + '_sidebar';
    res.locals.partials.footer = dashboard_views + 'footer';
  }

  next();
});

// Enable GZIP
site.use(compression());

// Ensure site is only ever loaded over HTTPS
site.use(middleware.forceSSL);

// The disable('x-powered-by')
// and use(compression()) must
// be specified for each individual
// app. Express considers each seperately.
site.disable('x-powered-by');

// Specify the template rendering config
site.set('trust proxy', 'loopback');
site.set('view engine', 'html');
site.engine('html', hogan);
site.set('views', views);

var maxAge = 0;

// We want to cache templates in production
if (config.environment !== 'development') {
  maxAge = 86400000;
  site.enable('view cache');
}

site.use(routes.simple);
site.use('/log-in', routes.log_in);
site.use('/clients', routes.clients);
site.use('/sign-up', routes.sign_up);
site.use('/updates', routes.updates);
site.use('/help', routes.help);
site.use('/stripe-webhook', routes.stripe_webhook);

// Serve static files too
site.use(express.static(static, {maxAge: maxAge}));

site.use(routes.redirects);
site.use(routes.error);

module.exports = site;