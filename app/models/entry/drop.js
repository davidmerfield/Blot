var helper = require('helper');
var ensure = helper.ensure;
var logger = helper.logger;

var set = require('./set');
var get = require('./get');

module.exports = function drop (blog, path, callback) {

  ensure(blog, 'object')
    .and(path, 'string')
    .and(callback, 'function');

  get(blog.id, path, function(entry){

    if (!entry) {
      logger(null, 'Blog: ' + blog.id + ': No entry to delete', path);
      return callback();
    }

    logger(null, 'Blog: ' + blog.id + ': Deleting entry', path);
    set(blog, path, {deleted: true}, callback);
  });
};

