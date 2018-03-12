var Metadata = require('../models/metadata');
var basename = require('path').basename;
var helper = require('helper');
var normalize = helper.pathNormalizer;

function encodeDirnames (path) {

  var dirs = path
          .split('/');

  dirs.forEach(function(dir, i, dirs){
    dirs[i] = encodeURIComponent(dir);
  });

  return dirs.join('/');
}

module.exports = function(server){

// Serve public files
  server.get('/public*', function(request, response, next){

    var blogID = request.blog.id;

    if (!request.url || !blogID) return next();

    var path = normalize(decodeURIComponent(request.url));

    Metadata.readdir(blogID, path, function(err, files, dir){

      // We didn't find a matching file and that's OK!
      if (err && err.code === 'ENOENT')
        return next();

      // We found a file, not a directory
      // this should have been sent by an earlier route
      if (err && err.code === 'ENOTDIR') {
        return next();
      }

      files.forEach(function(f, i, files){
        files[i].path = encodeDirnames(f.path);
      });

      if (err) return next(err);

      var dirname = basename(dir);

      // This public URL maps to a dir
      // so render the public view
      var crumbs = dir.slice(0, dir.lastIndexOf('/'));

      var breadcrumbs = [];

      while (crumbs.length && crumbs !== '/') {

        breadcrumbs.unshift({
          name: crumbs.slice(crumbs.lastIndexOf('/') + 1),
          path: crumbs
        });

        crumbs = crumbs.slice(0, crumbs.lastIndexOf('/'));
      }

      response.addLocals({
        path: path,
        dirname: dirname,
        breadcrumbs: breadcrumbs,
        contents: files
      });

      return response.renderView('public', next);
    });
  });
};