var helper = require('../../../helper');
var forEach = helper.forEach;
var ensure = helper.ensure;

var LocalPath = helper.localPath;
var RemotePath = require('../remotePath');

var addIgnore = require('../../../models/ignoredFiles').add;
var addPlaceholder = require('./addPlaceholder');
var dropEntry = require('../../../models/entry').drop;
var download = require('./download');

module.exports = function (blog, change, reason, client, callback){

  ensure(blog, 'object')
    .and(change, 'object')
    .and(client, 'object')
    .and(callback, 'function')
    .and(reason, 'string');

  var path = change.path_display;
  var modified = change.client_modified;

  var localPath = LocalPath(blog.id, path);
  var remotePath = RemotePath(blog.folder, path);

  ensure(path, 'string')
    .and(localPath, 'string')
    .and(modified, 'string');

  // Remove this file from the user's blog
  // and from the folder on the server.
  var queue = [
    addIgnore.bind(this, blog.id, path, reason),
    dropEntry.bind(this, blog.id, path)
  ];

  // Write a placeholder if the file exceeds
  // blot's limit, or download the file if not.
  // We download the file so that 'hidden' entries
  // like CSS and JS can be referenced in blog posts
  // even though blot cannot turn those files into
  // posts itself.
  if (reason === 'TOO_LARGE') {
    queue.push(addPlaceholder.bind(this, localPath, modified));
  } else {
    queue.push(download.bind(this, client, remotePath, localPath));
  }

  forEach(queue, function(method, next){

    method(next);

  }, callback);
};