var helper = require('../../../helper');
var forEach = helper.forEach;
var ensure = helper.ensure;

var LocalPath = helper.localPath;
var RemotePath = require('../remotePath');

var isDraft = require('../../../drafts').isDraft;
var Preview = require('../../../modules/preview');

var Entry = require('../../../models/entry');
var Ignored = require('../../../models/ignoredFiles');
var Metadata = require('../../../models/metadata');

var catchRename = require('./catchRename').forDeleted;

var dropFile = helper.remove;
var dropEntry = Entry.drop;
var dropPreview = Preview.remove;
var dropIgnored = Ignored.drop;
var dropMetadata = Metadata.drop;

module.exports = function (blog, change, client, callback){

  ensure(blog, 'object')
    .and(change, 'object')
    .and(change.path, 'string')
    .and(client, 'object')
    .and(callback, 'function');

  var path = change.path;
  var localPath = LocalPath(blog.id, path);
  var remotePath = RemotePath(blog.folder, path);

  // Build a queue. This assumes each method
  // can handle folders properly. And accepts a callback
  var queue = [
    dropMetadata.bind(this, blog.id, path),
    dropIgnored.bind(this, blog.id, path),
    catchRename.bind(this, blog.id, path),
    dropEntry.bind(this, blog.id, path),
    dropFile.bind(this, localPath)
  ];

  // Since this file was a draft, there will
  // be a corresponding preview file in the
  // user's dropbox folder. Remove it!
  if (isDraft(path)) {
    queue.push(
      dropPreview.bind(this, client, remotePath)
    );
  }

  forEach(queue, function(method, next){

    method(next);

  }, callback);
};
