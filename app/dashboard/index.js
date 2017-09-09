var express = require('express');
var dashboard = express();
var middleware = require('middleware');
var hogan = require('hogan-express');
var compression = require('compression');
var config = require('config');
var add = middleware.add;
var bodyParser = require('body-parser');
var csurf = require('csurf');
var csrf = csurf();
var Clients = require('clients');

dashboard
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
  .engine('html', hogan);

// For when we want to cache templates
if (config.environment !== 'development')
  dashboard.enable('view cache');

// Define these individually don't
// overwrite server.locals
dashboard.locals.protocol = config.protocol;
dashboard.locals.host = config.host;
dashboard.locals.title = 'Blot';
dashboard.locals.cacheID = Date.now();

dashboard.use(function(req, res, next){

  res.title = function(title) {
    res.locals.title = title;
  }

  res.renderAccount = function (view) {

    delete res.locals.partials;

    res.locals.partials = {};

    res.addPartials({
      head: 'partials/head',
      footer: 'partials/footer',
      nav: 'partials/nav',
      message: 'partials/message',
      yield: 'account/' + view
    });

    var tab = {};
    var tabname = view;

    if (tabname.indexOf('/') > -1)
      tabname = tabname.slice(0, tabname.indexOf('/'));

    tab[tabname] = 'selected';

    res.addLocals({tab: tab});

    res.render('account/wrapper');

  };

  res.renderDashboard = function(view, wrapper) {

    delete res.locals.partials;

    res.locals.partials = {};

    res.addPartials({
      head: 'partials/head',
      footer: 'partials/footer',
      nav: 'partials/nav',
      message: 'partials/message',
      yield: view
    });

    var tab = {};
    var tabname = view;

    if (tabname.indexOf('/') > -1)
      tabname = tabname.slice(0, tabname.indexOf('/'));

    tab[tabname] = 'selected';

    res.addLocals({tab: tab});

    res.render(wrapper || 'partials/wrapper');
  }

  next();
});

dashboard.use(add());



dashboard.use(middleware.messenger);
dashboard.use(middleware.loadUser);
dashboard.use(middleware.loadBlog);
dashboard.use(middleware.redirector);

dashboard.post(['/theme*', '/folder*', '/clients*', '/404s', '/account*', '/preferences*'], bodyParser.urlencoded({extended: false}));

dashboard.use(csrf, function(req, res, next){

  // Load the CSRF protection since we're
  // inside the app,
  res.addLocals({
    csrftoken: req.csrfToken()
  });

  next();
});

dashboard.use('/clients', Clients.routes.dashboard);

require('./routes/account')(dashboard);
require('./routes/editor')(dashboard);
require('./routes/folder')(dashboard);
require('./routes/preferences')(dashboard);
require('./routes/tools')(dashboard);
require('./routes/profile')(dashboard);
require('./routes/theme')(dashboard);

// need to handle dashboard errors better...
dashboard.use(function(err, req, res, next) {
  console.log(err);
  console.log(err.trace);
  console.log(err.stack);
  res.status(500);
  res.send(':( Error');
});

module.exports = dashboard;