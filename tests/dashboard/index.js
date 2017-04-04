var config = require('config');

var express = require('express');
var compression = require('compression');
var hogan = require('hogan-express');
var parser = require('body-parser').urlencoded({extended:false});

var session = require('express-session');
var redis = require('redis').createClient();
var Store = require('connect-redis')(session);

var dashboard = express();

// This removes a dumb header enabled
// by default which exposes the fact
// that the app is written in JavaScript
dashboard.disable('x-powered-by');

// I believe this will gzip HTML
// responses but not 100% sure.
dashboard.use(compression());

dashboard.set('view engine', 'html');
dashboard.set('views', __dirname + '/views');
dashboard.engine('html', hogan);

if (config.environment !== 'development')
  dashboard.enable('view cache');

dashboard.use(session({
  secret: config.session.secret,
  rolling: true,
  saveUninitialized: false,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: config.environment !== 'development'
  },
  store: new Store({
    client: redis,
    port: config.redis.port
  })
}));


// Don't allow the user to access the dashboard
// if I've set the maintenance flag to true in
// the config file. It's important this comes
// before the other routes!
if (config.maintenance) use('maintenance');

// We must load the user before loading the blog
// since users can have multiple blogs and we
// need to know which is currently active

use('force_ssl');
use('load_user');
use('load_blog');
use('messenger');
use('csrf');

dashboard.post('*', parser);

// route('design');
// route('auth');
// route('index');
// route('settings');

use('error');

function use (name) {

  var method = require('./middleware/' + name);

  dashboard.use(method);
}

function route (name) {
  require('./routes/' + name)(dashboard);
}

module.exports = dashboard;