var Blog = require('../../app/models/blog');
var randomString = require('./randomString');

module.exports = function (done) {
  
  var fakeHandle = randomString(16);

  console.log(fakeHandle, 'CREATING blog');

  Blog.create(global.user.uid, {handle: fakeHandle}, function(err, blog){
    if (err) {
      console.log(fakeHandle, 'ERROR CREATING BLOG', err);
      return done(err);
    }

    console.log(fakeHandle, 'CREATED blog');

    global.blog = blog;
    done(err);
  });
};
