var config = require('../../config');
var AWS = require('aws-sdk');
var helper = require('../helper');
var ensure = helper.ensure;
var blogFolder = require('./blogFolder');
var ROOT = require('./root');
var BUCKET = config.s3.buckets.blogs;

// Max number of items/files returned by s3.listObjects
var MAX_KEYS = 500;

// Load in my credentials...
AWS.config.update({
  accessKeyId: config.aws.key,
  secretAccessKey: config.aws.secret
});

module.exports = function removeFolder (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var prefix;
  var s3 = new AWS.S3();

  try {
    prefix = ROOT + blogFolder(blogID) + '/';
  } catch (e) {
    return callback(e);
  }

  // We need to be careful with so we don't interact with
  // anything outside the blog's folder on s3
  if (!prefix || prefix.length < 11 || prefix.lastIndexOf('/') !== prefix.length - 1)
    return callback(new Error('Invalid prefix'));

  var params = {
    Prefix: prefix,
    Bucket: BUCKET,
    MaxKeys: MAX_KEYS
  };

  s3.listObjects(params, function(err, data) {

    if (err) return callback(err);

    // The user hasn't uploaded anything...
    if (data.Contents.length === 0) return callback();

    params = {
      Bucket: BUCKET,
      Delete: {Objects:[]}
    };

    data.Contents.forEach(function(content) {

      // Ensure the key is inside the blog's folder
      if (content.Key.indexOf(prefix) !== 0) return;

      // If so, add it to the list of keys to drop from s3
      params.Delete.Objects.push({Key: content.Key});
    });

    s3.deleteObjects(params, function(err, status) {

      if (err) return callback(err);

      if (status && status.Deleted.length)
        console.log('Blog:', blogID , 'Deleted', status.Deleted.length, 'files');

      if (status && status.Errors.length)
        return callback(status.Errors);

      // Since we hit the limit for the number of files
      // to delete from this blog's folder, re-attempt it.
      if (data.Contents.length === MAX_KEYS)
        return removeFolder(blogID, callback);

      callback();
    });
  });
};