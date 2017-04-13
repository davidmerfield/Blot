module.exports = function(server){

  var config = require('config');
  var express = require('express');
  var maxAge = config.environment !== 'development' ? 86400000 : 0;
  var basename = require('path').basename;

  var helper = require('helper');
  var normalize = helper.pathNormalizer;

  var rootDir = helper.rootDir;
  var allDir = rootDir + '/www/blogs/*';

  var Metadata = require('../models/metadata');

  server.use(express.static(allDir, {maxAge: maxAge}));

  server.use(sendBlogFile(rootDir + '/blogs'));
  server.use(sendBlogFile(rootDir + '/www/blogs'));

  function sendBlogFile (root) {

    if (!root) throw 'Please pass a root directory';

    return function handler (req,res,next) {

      if (!req.path) return next();

      // I checked and this doesnt seem to be
      // dangerous. Not 100% sure though.
      // It maps '%20' to ' ' etc... and also lower
      // We add a trailing slash to allow
      // sendFile to pick up index.html files
      // we use req path to strip the query string
      var path = normalize(decodeURIComponent(req.path));

      // Resolve the blog directory to check.
      var blogDir = root + '/' + req.blog.id;

      res.sendFile(path, {root: blogDir}, function then (err){

        // We didn't find a matching file and that's OK!
        if (err && err.code === 'ENOENT')
          return next();

        // This path refers to a directory
        // which has no index file
        if (err && err.code === 'EISDIR' && path.slice(-1) !== '/') {
          path += '/';
          return res.sendFile(path, {root: blogDir}, then);
        }

        // which has no index file
        if (err && (err.code === 'EISDIR' || err.code === 'ENOTDIR'))
          return next();

        // Something else happened
        // so we pass that on.
        if (err) return next(err);

        // A file was sent successfully!
        // Do nothing!
      });
    };
  }

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



function encodeDirnames (path) {

  var dirs = path
          .split('/');

  dirs.forEach(function(dir, i, dirs){
    dirs[i] = encodeURIComponent(dir);
  });

  return dirs.join('/');
}