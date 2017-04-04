var db = require('db');
var Blog = db.blog;
var augment = Blog.extend;

var helper = require('helper');
var forEach = helper.forEach;

module.exports = function (req, res, next) {

  function no_blog () {

    delete req.blog;
    delete req.blogs;

    var err = new Error('No blog');

    err.code = 'NOBLOG';

    return next(err);
  }

  if (!req.session || !req.user)
    return no_blog();

  var blogID = req.session.blogID;
  var user = req.user;

  if (!blogID) {

    if (req.method === 'POST' || req.url === '/create-blog')
      return next();

    if (user.blogs.length) {
      blogID = user.blogs[0];
    } else {
      return res.redirect('/create-blog');
    }
  }

  req.blogs = [];

  forEach(req.user.blogs, function(id, nextBlog){

    Blog.get({id: id}, function(err, blog){

      if (err || !blog) return nextBlog();

      if (blog.id === blogID) {
        blog.isCurrent = true;
        req.blog = augment(blog);
      }

      req.blogs.push(blog);

      nextBlog();
    });

  }, function(){

    res.locals.blog = req.blog;
    res.locals.blogs = req.blogs;

    return next();
  });
};