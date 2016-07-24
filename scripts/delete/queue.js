var eachBlog = require('../each/blog');
var flushQueue = require('../../app/sync/dropbox/queue/flush');

eachBlog(function (user, blog, nextBlog) {

  console.log('Emptying queue files for', blog.handle);
  flushQueue(blog.id, nextBlog);

}, process.exit);