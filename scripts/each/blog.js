var User = require('../../app/models/user');
var Blog = require('../../app/models/blog');
var helper = require('../../app/helper');
var ForEach = helper.forEach;
var type = helper.type;
var ensure = helper.ensure;

module.exports = function (doThis, allDone, options) {

  options = options || {};

  ensure(doThis, 'function')
    .and(allDone, 'function')
    .and(options, 'object');

  Blog.getAllIDs(function(err, blogIDs){

    if (err || !blogIDs) throw err || 'No';

    console.log();
    console.log();

    if (options.s) {

      options.s = parseInt(options.s);
      console.log('Starting this script with blog which has ID', options.s);
      blogIDs = blogIDs.slice(options.s - 1);

    }

    if (options.e) {

      var end = parseInt(options.e);
      var start = 0;

      if (options.s) {
        start = parseInt(options.s);
        end = end - start + 1;
        if (end < 1) end = undefined;
      }

      if (end) {
        console.log('Ending this script at user with ID', options.e);
        blogIDs = blogIDs.slice(0, end);
      } else {
        console.log('Warning: The end option was less than the start...');
      }
    }

    if (options.o) {


      if (type(options.o, 'array')) {
        blogIDs = options.o.map(function(id){return id + '';});
      } else {
        blogIDs = [options.o + ''];
      }

      console.log('Starting this for blogs with ID', blogIDs.length > 1 ? blogIDs : blogIDs[0]);

    }

    console.log();
    console.log();

    var forEach = ForEach;

    if (options.p) {
      forEach = forEach.parallel;
    }

    if (options.m && type(options.m, 'number')) {
      forEach = forEach.multi(options.m);
    }

    forEach(blogIDs, function(blogID, nextBlog){

      Blog.get({id: blogID}, function(err, blog){

        if (err || !blog) throw err || 'No';

        User.getBy({uid: blog.owner}, function(err, user){

          if (err || !user) throw err || 'No';

          doThis(user, blog, nextBlog);
        });
      });
    }, allDone);
  });
};