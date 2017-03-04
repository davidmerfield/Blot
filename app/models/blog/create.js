var helper = require('../../helper');
var ensure = helper.ensure;
var extend = helper.extend;
var capitalise = helper.capitalise;
var defaults = require('./defaults');
var client = require('../client');
var key = require('./key');
var set = require('./set');

module.exports = function create (uid, info, callback) {

  var User = require('../user');

  ensure(uid, 'string')
    .and(info, 'object')
    .and(callback, 'function');

  User.getBy({uid: uid}, function(err, user){

    if (err) return callback(err);

    client.incr(key.totalBlogs, function(err, blogID){

      if (err) throw err;

      blogID += ''; // Cast to a string from int

      var blogs = user.blogs || [];

      var title;
      var folder;

      if (user.blogs.length > 0) {
        folder = '/' + info.handle;
        title = capitalise(info.handle) + '\'s blog';
      } else {
        folder = '/';
        title = user.name + '\’s blog';
      }

      var blog = {
        id: blogID,
        owner: uid,
        folder: folder,
        title: title,
        timeZone: info.timeZone || 'UTC',
        dateFormat: info.dateFormat || user.countryCode === 'US' ? 'M/D/YYYY' : 'D/M/YYYY'
      };

      extend(blog)
        .and(info)
        .and(defaults);

      blogs.push(blogID);

      User.set(uid, {blogs: blogs, lastSession: blogID}, function(errors){

        if (errors) throw errors;

        set(blogID, blog, function(err){

          return callback(err, blog, folder);
        });
      });
    });
  });
};