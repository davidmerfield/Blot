var Blog = require('../../app/models/blog');
var randomString = require('./randomString');

module.exports = function (done) {

  var context = this;

  Blog.create(context.user.uid, {handle: randomString(16)}, function(err, blog){
    
    if (err) {
      return done(err);
    }

    context.blog = blog;

    done(err);
  });
};
