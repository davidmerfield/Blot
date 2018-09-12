var forEach = require('helper').forEach.parallel;
var Blog = require('blog');
var User = require('user');

module.exports = function (req, res, next) {

  if (!req.session || !req.user || !req.user.blogs.length) return next();

  var blogs = [];
  var activeBlog = null;

  forEach(req.user.blogs, function(blogID, nextBlog){

    Blog.get({id: blogID}, function(err, blog){
      
      if (!blog) return nextBlog();

      try {
        blog = Blog.extend(blog);
      } catch (e) {
        return next(e);
      }

      if (req.session.blogID === blog.id) {
        blog.isCurrent = true;
        activeBlog = blog;
      }

      blogs.push(blog);
      nextBlog();
    });

  }, function(){

    if (!activeBlog && !req.session.blogID) {
      activeBlog = blogs.slice().pop();
    }

    // The blog active in the users session
    // no longer exists, redirect them to one
    if (!activeBlog && req.session.blogID) {

      var candidates = blogs.slice();

      candidates = candidates.filter(function(id){
        return id !== req.session.blogID;
      });

      if (candidates.length > 0) {
        activeBlog = candidates.pop();
        req.session.blogID = activeBlog.id;
        User.set(req.user.uid, {lastSession: activeBlog.id}, function(){});
      } else {
        req.session.blogID = null;
        User.set(req.user.uid, {lastSession: ''}, function(){});
        console.log('THERES NOTHING HERE');
      }
    }

    if (!activeBlog) return next(new Error('No blog'));

    req.blog = activeBlog;
    req.blogs = blogs;

    res.locals.blog = activeBlog;
    res.locals.blogs = blogs;

    return next();
  });
};
