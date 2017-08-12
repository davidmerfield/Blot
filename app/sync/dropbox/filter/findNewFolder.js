// This is not in use right now.
// I should reintegrate some of this functionality in future

var Blog = require('../../../models/blog');

var getBlogFolders = require('./getBlogFolders');
var helper = require('../../../helper');
var ensure = helper.ensure;
var normalize = helper.pathNormalizer;

module.exports = function (blogID, removedFolder, changes, callback){

  ensure(blogID, 'string')
    .and(removedFolder, 'string')
    .and(changes, 'array')
    .and(callback, 'function');

  var candidates = [];
  var newFolder = '';

  // Retrieve an array of normalized existing
  // blog folders that the user has.
  getExisting(blogID, removedFolder, function(err, existing){

    if (err) return callback(err);

    // First we build a list of candidates
    // to replace a potentially removed blog folder
    candidates = changes.filter(function(c){

      return !c.wasRemoved &&

              // any new candidates for a blog folder must
              // be folders for obvious reasons
              c.stat && c.stat.is_dir &&

              // The new folder is NOT already a blog folder
              existing.indexOf(normalize(c.path)) === -1 &&

              // require single level nesting e.g. /maybe not /maybe/not
              c.path.split('/').length === 2;
    });

    // There is a candidate among the new folders associated
    // with this change to users folder!
    if (candidates.length && candidates[0] && candidates[0].path) {
      return callback(null, candidates[0].path);
    }

    // Now we read the contents of the
    // user's root directory to determine if
    // there are other, previously ignored
    // folders we could use.
    Blog.makeClient(blogID, function(err, client){

      if (err) return callback(err);

      var rootdir = '/';

      // When we move to entire folder option, this should
      // be user.sync.rootdir ?
      client.readdir(rootdir, function(err, stat, contents){

        if (err) return callback(err);

        try {

          contents = contents._json.contents;

          contents = contents.filter(function(c){
            return c.is_dir && existing.indexOf(normalize(c.path)) === -1;
          });

        } catch (e) {

          return callback(e);
        }

        if (contents.length && contents[0] && contents[0].path) {
          newFolder = contents[0].path;
        } else {
          newFolder = '';
        }

        return callback(null, newFolder);
      });
    });
  });
};

function getExisting (blogID, removedFolder, callback) {

  removedFolder = normalize(removedFolder);

  Blog.get({id: blogID}, function(err, blog){

    if (err || !blog) return callback(err || new Error('No blog'));

    getBlogFolders(blog.owner, function(err, folders){

      if (err) return callback(err);

      var response = [];

      for (var i in folders) {

        var folder = normalize(i);

        if (folder === removedFolder) continue;

        response.push(folder);
      }

      return callback(null, response);
    });
  });
}