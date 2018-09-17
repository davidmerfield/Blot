var helper = require('helper');
var ensure = helper.ensure;
var logger = helper.logger;

var set = require('./set');
var get = require('./get');

module.exports = function drop (blogID, path, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  get(blogID, path, function(entry){

    if (!entry) {
      logger(null, 'Blog: ' + blogID + ': No entry to delete', path);
      return callback();
    }

    logger(null, 'Blog: ' + blogID + ': Deleting entry', path);
    set(blogID, path, {deleted: true}, callback);
  });
};

