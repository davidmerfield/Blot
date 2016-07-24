var config = require('../../config');
var helper = require('../helper');
var ensure = helper.ensure;
var log = new helper.logg('Cache: Set');
var normalize = require('./normalize');
var _ = require('lodash');
var client = require('redis').createClient();
var key = require('./keys');
var allKey = key.all();

// 1 day is current cache expiry, just to keep database small
// there is no reason cache keys couldn't be infinite?
// when we have more memory than sense... even still I am nervous.
var EXPIRY = 60 * 60 * 24;

function set (request, content, type, prefix) {

  prefix = prefix || '';

  ensure(request, 'object')
    .and(content, 'string')
    .and(prefix, 'string')
    .and(type, 'string');

  var fullUrl = normalize(prefix +
                          request.protocol + '://' +
                          request.get('host') +
                          request.originalUrl);

  // Don't cache authenticated requests...
  // Authenticated requests also have request.blog
  // so we do this step first
  if (request.session && (request.session.uid || !_.isEqual(_.keys(request.session), ['cookie']))) {
    log.debug('........ skipping SET, session set', fullUrl);
    return;
  }

  // Only cache blogs
  if ((!request.blog || !request.blog.id) && request.get('host') !== config.host) {
    log.debug('........ skipping SET, no blog ID', fullUrl);
    return;
  }

  var blogID = request.blog ? request.blog.id : '0';
  var blogKey = key.blog(blogID);

  var typeKey = key.type(fullUrl);
  var contentKey = key.content(fullUrl);

  var multi = client.multi();

  multi.sadd(blogKey, contentKey);
  multi.sadd(blogKey, typeKey);

  // Store this key as part of the cache
  // so we can flush the site's cache as needed...
  multi.sadd(allKey, contentKey);
  multi.sadd(allKey, typeKey);
  multi.sadd(allKey, blogKey);

  // Store the URLs content against its URL
  multi.set(contentKey, content);
  multi.expire(contentKey, EXPIRY);

  // Set the URLs content-type header to expire in future
  multi.set(typeKey, type);
  multi.expire(typeKey, EXPIRY);

  multi.exec(function(err) {

    if (err) throw err;

    log.debug('Stored cached ' + type + ' copy of', fullUrl);
  });
}

if (config.cache === false) {
  module.exports = function doNothing () {};
} else {
  module.exports = set;
}