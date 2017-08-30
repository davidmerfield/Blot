var helper = require('helper');
var ensure = helper.ensure;
var normalize = helper.pathNormalizer;

var Remove = require('./remove');
var Update = require('./update');

module.exports = function handle (blog, client, change, callback) {

  ensure(blog, 'object')
    .and(client, 'object')
    .and(change, 'object')
    .and(callback, 'function');

  var folder = blog.folder;

  // This change is not inside the blog's folder
  if (normalize(change.path_display).indexOf(normalize(folder)) !== 0)
    return callback();

  if (folder && folder !== '/')
    change.path_display = change.path_display.slice(folder.length);

  if (change['.tag'] === 'deleted') {

    console.log('removing', change);

    Remove(blog, change, client, callback);

  } else {

    console.log('updating', change);

    Update(blog, change, client, callback);

  }
};