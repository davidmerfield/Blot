var rebuild = require('../../../rebuild');

var Blog = require('blog');
var resaveEntries = require('./resaveEntries');


var saveRedirects = require('./saveRedirects');
var form = require('./form');

// Resave all the blog posts from the source file in
// the blog's folder if these properties change.
var RESAVE = ['timeZone', 'dateDisplay', 'permalink'];

// Rebuild all the blog posts from the source file in
// the blog's folder if these properties change.
var REBUILD = ['plugins'];

module.exports = function(server) {

  server.route('/flags')

    .get(function(req, res){

      var flags = [];

      for (var i in Blog.scheme.TYPE) {
        if (Blog.scheme.TYPE[i] === 'boolean')
          flags.push({name: i, checked: req.blog[i] ? 'checked' : ''});
      }

      console.log(flags);

      res.locals.flags = flags;
      res.title('Flags');
      res.renderDashboard('preferences/flags');
    })

    .post(saveRedirects, form, function(req, res, next){

      var blog = req.blog;
      var updates = req.body;

      Blog.set(blog.id, updates, function(err, changes){

        if (err) return next(err);

        if (changes && changes.length)
          res.message({success: 'Made changes successfully!'});

        // We now need to save every entry so that
        // changes to permalink format take effect.
        if (shouldResave(changes)) {
          resaveEntries(blog.id, function(){});
        }

        // We need to build all the blog's entries if the user
        // has changed any of the plugins or their permalink
        // format. This should be improved but we.
        if (shouldRebuild(changes)) {
          rebuild(blog.id);
        }

        res.redirect(req.path);
      });
    });
};

var shouldRebuild = checkOverlap(REBUILD);
var shouldResave = checkOverlap(RESAVE);

function checkOverlap (list){

  return function (changes) {

    var res = false;

    changes.forEach(function(changed_property){

      if (list.indexOf(changed_property) > -1) res = true;

      return false;
    });

    return res;
  };
}