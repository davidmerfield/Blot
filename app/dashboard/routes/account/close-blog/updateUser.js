var User = require('user');

module.exports = function (req, res, next) {

  var blogToClose = req.blogToClose;
  var blogs = req.user.blogs.slice();

  blogs = blogs.filter(function(blogID){
    return blogID !== blogToClose.id;
  });

  User.set(req.user.uid, {blogs: blogs}, function(err){

    if (err) return next(err);

    req.session.blogID = blogs.pop() || '';
    next();
  });
};

