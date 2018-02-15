module.exports = function(server){

  var config = require('config');
  var express = require('express');
  var maxAge = config.environment !== 'development' ? 86400000 : 0;
  var mime = require('mime-types');
  var basename = require('path').basename;

  var helper = require('helper');
  var normalize = helper.pathNormalizer;

  var rootDir = helper.rootDir;
  var allDir = rootDir + '/www/blogs/*';

  var Metadata = require('../models/metadata');


  server.use(sendBlogFile(rootDir + '/blogs'));

  // the files for Blot's MSWORD feature are placed
  // here for some reason.
  server.use(sendBlogFile(rootDir + '/www/blogs'));

  server.use(express.static(allDir, {maxAge: maxAge}));

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

      // If we can't determine a mime type for a given path,
      // assume it is HTML if we are responding to a request
      // for a directory, or an octet stream otherwise...
      var default_mime = path.indexOf('.') > -1 ? 'application/octet-stream' : 'text/html';

      res.contentType(mime.contentType(mime.lookup(path) || default_mime));

      res.sendFile(path, {root: blogDir}, function then (err){

        // A file was sent successfully! Do nothing!
        if (!err) return res.end();

        // We didn't find a matching file and that's OK!
        if (err && err.code === 'ENOENT')
          return next();

        // Attempt to send an index file inside a directory
        if (err && err.code === 'EISDIR' && path.slice(-1) !== '/') {
          path += '/';
          res.contentType(mime.contentType('index.html'));
          return res.sendFile(path, {root: blogDir}, then);
        }

        // headers were sent but there was an error.
        // It's possible this is the 304 error bug that
        // should be fixed in express version 5.0:
        // https://github.com/expressjs/express/commit/3387916efcac19302188151a24927a0405a373e8
        // I found this bug courtesy of this question:
        // http://stackoverflow.com/questions/26049466
        if (err && res.headersSent) {
          console.log(new Date(), 'Error: res.sendFile with res.headersSent for:', req.host + req.url, 'res.statusCode:', res.statusCode, err);
          return next(err);
        }

        // There is no index file in this directory...
        // Remove the contentType header we set earlier and
        // proceed to the next matching route without err.
        if (err && (err.code === 'EISDIR' || err.code === 'ENOTDIR')) {
          res.removeHeader('Content-Type');
          return next();
        }

        // Something else happened so we pass that on.
        // after removing the header we set earlier
        if (err && !res.headersSent) {
          res.removeHeader('Content-Type');
          return next(err);
        }
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