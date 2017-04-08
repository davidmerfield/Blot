var rebuild = require('../../../rebuild');

var Blog = require('blog');
var resaveEntries = require('./resaveEntries');
var loadPlugins = require('./loadPlugins');
var loadTimeZones = require('./loadTimeZones');

var form = require('./form');

module.exports = function(server) {

  require('./404s')(server);
  require('./redirects')(server);

  server.route('/preferences')

    .get(loadPlugins, loadTimeZones)

    .get(function(req, res){
      // console.log(req.blog.plugins);
      res.title('Preferences');
      res.renderDashboard('preferences');
    })

    .post(form, function(req, res, next){

      var blog = req.blog;
      var blogID = blog.id;
      var updates = req.body;

      Blog.set(blogID, updates, function(err, changes){

        if (err) return next(err);

        if (changes.indexOf('timeZone') > -1 ||
            changes.indexOf('dateDisplay') > -1) {
          resaveEntries(blogID, function(){
            //
          });
        }

        if (changes && changes.length)
          res.message({success: 'Made changes successfully!'});

        if (changes && changes.indexOf('plugins') > -1)
          rebuild(blog.id);

        res.redirect(req.path);
      });
    });
};