var helper = require('../../helper');
var ensure = helper.ensure;
var logger = helper.logger;

var getByPath = require('./getByPath');
var set = require('./set');
var catchRename = require('./_catchRename').forDeleted;

module.exports = function drop (blogID, path, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  getByPath(blogID, path, function(existing){

    // There's nothing to delete
    if (!existing || !existing.id) return callback();

    catchRename(blogID, existing, function(err, wasRenamed){

      if (err) return callback(err);

      if (wasRenamed) return callback();

      logger(null, 'Blog: ' + blogID + ': Deleted entry', path);
      set(blogID, existing.id, {deleted: true}, callback);
    });
  });
};

