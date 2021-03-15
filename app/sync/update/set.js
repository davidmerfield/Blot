var helper = require("helper");
var normalize = helper.pathNormalizer;
var rebuildDependents = require("./rebuildDependents");
var Ignore = require("./ignore");
var Metadata = require("metadata");
var Entry = require("entry");
var Preview = require("./preview");
var isPreview = require("./drafts").isPreview;
var async = require("async");
var WRONG_TYPE = "WRONG_TYPE";
var PUBLIC_FILE = "PUBLIC_FILE";
var isHidden = require("build/prepare/isHidden");
var build = require("build");

function isPublic(path) {
  return (
    // blot specific rule not to turn files inside
    // a folder called public into blog posts
    normalize(path).indexOf("/public/") === 0 ||
    // blot specific rule to ignore files and folders
    // whose name begins with an underscore
    normalize(path).indexOf("/_") > -1 ||
    // convention to ingore dotfiles or folders
    normalize(path).indexOf("/.") > -1
  );
}

function isTemplate(path) {
  return normalize(path).indexOf("/templates/") === 0;
}

module.exports = function (blogID, path, options, callback) {
  var queue;

  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  // Blot likes leading slashes
  if (path[0] !== "/") path = "/" + path;

  queue = {
    is_preview: isPreview.bind(this, blogID, path),
    dependents: rebuildDependents.bind(this, blogID, path),
  };

  // Store the case-preserved name against the
  // path to this file
  if (options.name) {
    queue.metadata = Metadata.add.bind(this, blogID, path, options.name);
  }

  async.parallel(queue, function (err, result) {
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
    if (isPublic(path)) return Ignore(blogID, path, PUBLIC_FILE, callback);

    build(blogID, path, options, function (err, entry) {
      if (err && err.code === "WRONGTYPE")
        return Ignore(blogID, path, WRONG_TYPE, callback);

      if (err) return callback(err);

      // This file is a draft, write a preview file
      // to the users Dropbox and continue down
      // We look up the remote path later in this module...
      if (entry.draft && !isHidden(entry.path)) Preview.write(blogID, path);

      Entry.set(blogID, entry.path, entry, callback);
    });
  });
};
