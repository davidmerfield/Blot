var helper = require('helper');
var ensure = helper.ensure;
var candidate = require('./candidate');

var Create = require('./create');
var Transformer = require('../../../../transformer');

module.exports = function (blog, path, metadata, html, callback) {

  ensure(blog, 'object')
    .and(path, 'string')
    .and(metadata, 'object')
    .and(html, 'string')
    .and(callback, 'function');

  var store = new Transformer(blog.id, 'thumbnails');
  var create = new Create(blog.id);

  // Extract the best candidate for a thumbnail from
  // this entry's HTML. It optimizes for image size
  var src = metadata.thumbnail || candidate(html);

  // Finish early, with an empty object
  // since that what make entry wants
  if (!src) return callback(null, {});

  // Check to see if we have created thumbnails
  // for this src and this blog. If not, pass the
  // downloaded file to create before returning
  // the resulting thumbnails
  store.lookup(src, create, function(err, thumbnails){

    if (err) return callback(err, thumbnails || {});

    return callback(null, thumbnails || {});
  });
};