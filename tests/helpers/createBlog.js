var Blog = require('../../app/models/blog');
var randomString = require('./randomString');

module.exports = function (done) {
  
  var fakeHandle = randomString(16);

  Blog.create(global.user.uid, {handle: fakeHandle}, function(err, blog){
    if (err) return done(err);
    global.blog = blog;
    done(err);
  });
};
