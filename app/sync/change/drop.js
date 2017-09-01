var fs = require('fs-extra');
var helper = require('helper');
var forEach = helper.forEach;
var ensure = helper.ensure;
var LocalPath = helper.localPath;

var Entry = require('entry');
var Metadata = require('metadata');
var Ignored = require('ignored');
var Rename = require('./set/catchRename');

var Preview = require('../../modules/preview');

module.exports = function (blogID, path, callback){

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  // Build a queue. This assumes each method
  // can handle folders properly. And accepts a callback
  var queue = [
    Metadata.drop.bind(this, blogID, path),
    // Preview.remove.bind(this, blogID, path),
    Ignored.drop.bind(this, blogID, path),
    Rename.forDeleted.bind(this, blogID, path),
    Entry.drop.bind(this, blogID, path),
    fs.remove.bind(this, LocalPath(blogID, path))
  ];

  forEach(queue, function(method, next){

    method(next);

  }, callback);
};
