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

  User.getById(uid, function(err, user){

    if (err || !user) return callback(err || new Error('No user'));

    client.incr(key.totalBlogs, function(err, blogID){

      if (err) throw err;

      // Cast to a string from int
      blogID += '';

      var blogs = user.blogs || [];
      var title = capitalise(info.handle) + '\’s blog';

      var blog = {
        id: blogID,
        owner: uid,
        title: title,
        client: '',
        timeZone: info.timeZone || 'UTC',
        dateFormat: info.dateFormat || 'M/D/YYYY'
      };

      extend(blog)
        .and(info)
        .and(defaults);

      blogs.push(blogID);

      User.set(uid, {blogs: blogs, lastSession: blogID}, function(errors){

        if (errors) throw errors;

        set(blogID, blog, function(err){

          return callback(err, blog);
        });
      });
    });
  });
};