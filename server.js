
// This ensures the sync and rebuild child processes can be killed cleanly
var cleanExit = function() { process.exit();};
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

var config = require('./config');
var analytics = require('./app/middleware').analytics;
var cache = require('./app/cache');
var scheduler = require('./app/scheduler');
var express = require('express');
var compression = require('compression');
var vhost = require('vhost');
var helmet = require('helmet');

var site = require('./app/site');
var blogs = require('./app/blogs');



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
  .use(vhost(config.host, site))
  .use(vhost('publicfonts.org', site))

  // It is important that this route returns
  // 200 so that the script which determines
  // whether the server is health runs OK!
  // Don't remove it unless you change monit.rc
  // It needs to be here because VHOSTS prevent
  // it from working under the sites app
  .use('/health', function(req, res, next){
    if (req.hostname === 'localhost') res.send('OK');
    return next();
  })

  .use(blogs);



// Create an HTTP service.
server.listen(config.port);

console.log('Server started! Now listening for requests on port ' + config.port);

// Flush the cache for the homepage!
cache.clear('0');

// Unleash the daemon for backups, syncs and emails
scheduler();