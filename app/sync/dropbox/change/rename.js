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

var renameEntry = Entry.rename;
var removeFile = helper.remove;
var dropIgnored = Ignored.drop;
var dropPreview = Preview.remove;
var dropMetadata = Metadata.drop;

var Update = require('./update');

module.exports = function (blog, change, client, callback){

  ensure(blog, 'object')
    .and(change, 'object')
    .and(change.oldPath, 'string')
    .and(client, 'object')
    .and(callback, 'function');

  var newPath = change.path;

  var oldPath = change.oldPath;
  var oldRemotePath = RemotePath(blog.folder, oldPath);
  var oldLocalPath = LocalPath(blog.id, oldPath);

  var queue = [
    removeFile.bind(this, oldLocalPath),
    dropIgnored.bind(this, blog.id, oldPath),
    dropMetadata.bind(this, blog.id, oldPath),
    renameEntry.bind(this, blog.id, oldPath, newPath)
  ];

  // Since this file was a draft, there will
  // be a corresponding preview file in the
  // user's dropbox folder. Remove it!
  if (isDraft(oldPath)) {
    queue.push(
      dropPreview.bind(this, client, oldRemotePath)
    );
  }

  forEach(queue, function(method, next){

    method(next);

  }, function(){

    Update(blog, change, client, callback);
  });
};