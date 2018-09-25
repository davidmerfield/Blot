var Blog = require('../../app/models/blog');
var randomString = require('./randomString');

module.exports = function (done) {
  
  var fakeHandle = randomString(16);
  var _this = this;

  Blog.create(this.user.uid, {handle: fakeHandle}, function(err, blog){
    
    if (err) {
      return done(err);
    }

    _this.blog = blog;
    
    done(err);
  });
};
