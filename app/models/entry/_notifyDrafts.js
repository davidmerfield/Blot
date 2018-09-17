
var helper = require('helper');
var ensure = helper.ensure;
var redis = require('client');
var model = require('./model');

module.exports = function (blog, entry, callback) {

  ensure(blog, 'object')
    .and(entry, model)
    .and(callback, 'function');

  if (!entry.draft) return callback();

  var channel = 'blog:' + blog.id +
                ':draft:' + entry.path;

  // Now the entry has been updated,
  // tell the server to send a SSE event
  // to any browsers viewing the preview

  // for this entry and refresh the IFRAME

  redis.publish(channel, Date.now().toString(), callback);
};