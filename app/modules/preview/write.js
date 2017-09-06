var drafts = require('../../drafts');
var helper = require('../../helper');
var ensure = helper.ensure;
var previewPath = drafts.previewPath;
var Blog = require('blog');

module.exports = function (blogID, path, callback) {

  callback = callback || console.log;

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  var clients = require('clients');

  Blog.get({id: blogID}, function(err, blog){

    if (err) return callback(err);

    var preview_path = previewPath(path);

    drafts.previewFile(blog.handle, path, function (err, contents) {

      if (err) return callback(err);

      clients[blog.client].write(blogID, preview_path, contents, callback);
    });
  });
};