var drafts = require('../../drafts');
var helper = require('../../helper');
var ensure = helper.ensure;
var previewPath = drafts.previewPath;

module.exports = function (blogID, path, callback) {

  callback = callback || console.log;

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  var clients = require('clients');

  require('blog').get({id: blogID}, function(err, blog){

    if (err) return callback(err);

    if (!blog.client) return callback();

    var preview_path = previewPath(path);

    drafts.previewFile(blog.handle, path, function (err, contents) {

      if (err) return callback(err);

      var client = clients[blog.client];

      client.write(blogID, preview_path, contents, callback);
    });
  });
};