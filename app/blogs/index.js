var renderView = require('../render/middleware');
var helper = require('helper');
var express = require('express');
var middleware = require('middleware');
var config = require('config');
var cache = require('../cache');
var compression = require('compression');

// This serves the content
// of users' blogs
var blog = express();

// Custom domain & subdomain middleware
// also handles the mapping of preview domains
blog
  .disable('x-powered-by')
  .use(compression())
  .use(middleware.vhosts)
  .use(middleware.add())
  .use(cache.middleware());

// Only time uncached responses
if (config.flags.time_response)
 blog.use(middleware.responseTime);

// Load in the rendering engine
blog.use(renderView);

var routes = helper.dirToModule(__dirname, require);

for (var i in routes)
  routes[i](blog);

module.exports = blog;