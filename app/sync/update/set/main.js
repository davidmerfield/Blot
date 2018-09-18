var debug = require('debug')('blot:sync:change:set');
var helper = require("../../../helper");
var normalize = helper.pathNormalizer;
var rebuildDependents = require("../rebuildDependents");

var Ignore = require("./ignore");
var Metadata = require("metadata");
var Entry = require("entry");
var Preview = require("../../../modules/preview");
var isPreview = require("../../../drafts").isPreview;
var async = require("async");
var catchRename = require("./catchRename").forCreated;

// var file = require("../../../models/entry/build/file");
var WRONG_TYPE = "WRONG_TYPE";
var PUBLIC_FILE = "PUBLIC_FILE";

function isPublic(path) {
  return (
    normalize(path).indexOf("/public/") === 0 ||
    normalize(path).indexOf("/_") === 0
  );
}

function isTemplate(path) {
  return normalize(path).indexOf("/templates/") === 0;
}

function isWrongType(path) {
  var isWrong = true;

  for (var i in file) if (file[i].is(path)) isWrong = false;

  return isWrong;
}

process.on('message', function(message){
    
  console.log('recieved message in main.js', message);

  var blog = message.blog;
  var path = message.path;
  var options = message.options;
  var callback = function(err){
    var response = {err: err, identifier: message.identifier};
    console.log('sending message from main.js', response);
    process.send(response);
  };

  var queue, is_preview;

  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  queue = {
    is_preview: isPreview.bind(this, blog.id, path),
    dependents: rebuildDependents.bind(this, blog.id, path)
  };

  // Store the case-preserved name against the
  // path to this file
  if (options.name) {
    queue.metadata = Metadata.add.bind(this, blog.id, path, options.name);
  }

  async.parallel(queue, function(err, result) {
    if (err) return callback(err);

    // This is a preview file, don't create an entry
    if (result.is_preview) return callback();

    // The file belongs to a template and there
    // fore should not become a blog post.
    if (isTemplate(path)) return callback();

    // The file is public. Its name begins
    // with an underscore, or it's inside a folder
    // whose name begins with an underscore. It should
    // therefore not be a blog post.
    if (isPublic(path)) return Ignore(blog.id, path, PUBLIC_FILE, callback);

    // This file cannot become a blog post because it is not
    // a type that Blot can process properly.
    if (isWrongType(path)) return Ignore(blog.id, path, WRONG_TYPE, callback);

    debug('Blog:', blog.id, path, ' beginning to build');

    Entry.build(blog, path, function(err, entry) {
  
      debug('Blog:', blog.id, path, ' build complete');
    
      if (err) return callback(err);

      // this checks the entry to see if a deleted entry
      // matches it. If so, then use the deleted entry's url and created date.
      catchRename(blog.id, entry, function(err, changes) {

        if (err) return callback(err);

        if (changes) for (var key in changes) entry[key] = changes[key];

        // This file is a draft, write a preview file
        // to the users Dropbox and continue down
        // We look up the remote path later in this module...
        if (entry.draft) Preview.write(blog.id, path);

        Entry.set(blog, entry.path, entry, callback);
      });
    });
  });
});
