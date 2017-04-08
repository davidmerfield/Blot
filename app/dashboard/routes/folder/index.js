var fs = require('fs');
var helper = require('helper');
var read = require('./read');
var breadcrumbs = require('./breadcrumbs');
var localPath = helper.localPath;

module.exports = function(server){

  server.get(['/', '/~*'], function(req, res, next){

    var dir = req.path.slice('/~'.length) || '/';

    dir = decodeURIComponent(dir);

    read(req.blog, dir, function onRead (err, contents, correctCaseDir, stat){

      if (err && err.code === 'ENOTDIR')
        return next();

      if (err && err.code === 'ENOENT' && dir === '/') {

        return fs.mkdir(localPath(req.blog.id, '/'), function(err){

          if (err) return next(err);

          read(req.blog, dir, onRead);
        });
      }

      if (err && err.code === 'ENOENT')
        return next();

      if (err)
        return next(err);

      res.addLocals({
        breadcrumbs: breadcrumbs(correctCaseDir),
        stat: stat,
        contents: contents
      });

      res.title('Your folder');
      res.renderDashboard('folder');
    });
  });
};