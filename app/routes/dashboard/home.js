module.exports = function(server){

  var check = require('../../authHandler').check;
  var read = require('./_folder/read');
  var breadcrumbs = require('./_folder/breadcrumbs');

  server.get(['/', '/~*'], check, function(req, res, next){

    if (!req.user) return next();

    var dir = req.path.slice('/~'.length) || '/';

    dir = decodeURIComponent(dir);

    read(req.blog, dir, function(err, contents, dir, stat){

      if (err && err.code === 'ENOTDIR')
        return next();

      if (err && err.code === 'ENOENT')
        return next();

      if (err)
        return next(err);

      res.addLocals({

        selected: {home: 'selected'},
        tab: {home: 'selected'},
        breadcrumbs: breadcrumbs(dir),

        stat: stat,
        contents: contents
      });

      res.addPartials({
        yield: 'dashboard/folder'
      });

      res.render('dashboard/_wrapper');
    });
  });


  // scheduled.forEach(function(entry, i){

  //   entry.toNow = moment
  //                   .utc(entry.dateStamp)
  //                   .fromNow();

  //   entry.date = moment
  //                .utc(entry.dateStamp)
  //                .tz(blog.timeZone)
  //                .format('MMMM Do YYYY, h:mma');

  //   scheduled[i] = entry;
  // });
};