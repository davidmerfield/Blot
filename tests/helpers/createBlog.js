var Blog = require('../../app/models/blog');

var chars = 'abcdefghijklmnopqrstuvwxyz'.split('');

function randomHandle () {
  var res = '';
  while(res.length < 16) res+= chars[Math.floor(Math.random() * chars.length)];
  return res;
}

module.exports = function (done) {
  Blog.create(global.user.uid, {handle: randomHandle()}, function(err, blog){
    if (err) return done(err);
    global.blog = blog;
    done(err);
  });
};
