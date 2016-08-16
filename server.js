// For the sync and rebuild child processes, ensure they
// can be killed cleanly...
var cleanExit = function() { process.exit();};
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

var config = require('./config');

var analytics = require('./app/analytics');
var cache = require('./app/cache');
var loadRoutes = require('./app/routes/load');
var vhosts = require('./app/routes/vhosts');
var responseTime = require('./app/routes/responseTime');

var renderView = require('./app/render/middleware');
var renderView2 = require('./app/render/v2/middleware');

var scheduler = require('./app/scheduler');
var add = require('./app/routes/add');
var messenger = require('./app/routes/messenger');

var express = require('express');
var hogan = require('hogan-express');

var session = require('express-session');
var redis = require('redis').createClient();
var Store = require('connect-redis')(session);

var compression = require('compression');
var vhost = require('vhost');
var helmet = require('helmet');


// This app serves the dashboard
// and marketing homepage.
var site = express();

// The default partials are for
// logged out users When we
// check authentication we swap
// these for the logged-in.

// The disable('x-powered-by')
// and use(compression()) must
// be specified for each individual
// app. Express considers each seperately.
site
  .disable('x-powered-by')
  .use(compression())
  .set('trust proxy', 'loopback')
  .set('view engine', 'html')
  .set('views', __dirname + '/app/views')
  .engine('html', hogan);

// For when we want to cache templates
if (config.environment !== 'development')
  site.enable('view cache');

// Define these individually don't
// overwrite server.locals
site.locals.protocol = config.protocol;
site.locals.host = config.host;
site.locals.title = 'Blot';
site.locals.cacheID = Date.now();

// Session settings
// It is important that session
// comes before the cache so we
// know what to serve to which user

var sessionOptions = {
  secret: config.session.secret,
  saveUninitialized: false,
  resave: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: config.environment !== 'development'
  },
  store: new Store({
    client: redis,
    port: config.redis.port
  })
};

// The order of this shit is important
// I've disabled the cache on the main
// site for now. In future, add .use(cache.middleware());

// Set default partials. These are for
// the logged-out site.
site.use(add({
  head: 'public/_head',
  header: 'public/_header',
  footer: 'public/_footer'
}));

site.use(session(sessionOptions));
site.use(messenger); // after session!

loadRoutes(site, '/dashboard');
loadRoutes(site, '/site');

var staticDir = __dirname + '/www/blot';

site
  .use(express.static(staticDir, {maxAge: 86400000}));

require('./app/routes/error')(site);



// This serves the content
// of users' blogs
var blog = express();

// Custom domain & subdomain middleware
// also handles the mapping of preview domains
blog
  .disable('x-powered-by')
  .use(compression())
  .use(vhosts)
  .use(add())
  .use(cache.middleware());

// Only time uncached responses
if (config.flags.time_response)
 blog.use(responseTime);

// Load in the appropriate rendering engine
if (config.flags.v2) {
  blog.use(renderView2);
} else {
  blog.use(renderView);
}

// Load the routes!
loadRoutes(blog, '/blog');

// All together now
var server = express();

// Prevent IE users from executing
// downloads in your site's context
// Prevent some browsers from
// sniffing some mimetypes
// Don't allow Blot to be used in iframes
// Create directive at /crossdomain.xml
// which prevents flash from doing shit
// Rendering middleware
server
  .disable('x-powered-by')
  .use(compression())
  .set('trust proxy', 'loopback')
  .use(helmet.ieNoOpen())
  .use(helmet.noSniff())
  .use(helmet.frameguard('allow-from', config.host))
  .use(helmet.crossdomain())
  .use(analytics.middleware)
  // check to see if session exists
  // before using the dashbord so
  // avoid passing the error
  // var dashboard = require('./app/dashboard');
  // .use(vhost(siteHost, dashboard))

  // since a lot will fall through
  // site should handle 404s.
  .use(vhost(config.host, site))
  .use(vhost('publicfonts.org', site))

  // It is important that this route returns
  // 200 so that the script which determines
  // whether the server is health runs OK!
  // Don't remove it unless you change monit.rc
  .use('/health', function(req, res, next){
    if (req.hostname === 'localhost') res.send('OK');
    return next();
  })

  .use(blog);

// Create an HTTP service.
server.listen(config.port);

console.log('Server start complete!');
console.log('Listening for requests on port ' + config.port);

// Flush the cache for the homepage!
cache.clear('0');

// Unleash the daemon for backups, syncs and emails
scheduler();