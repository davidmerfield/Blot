var get = require('./get');
var Blog = require('../../app/models/blog');

get(process.argv[2], function(user, blog){

  if (!blog || !blog.id) throw 'no blog';

  Blog.set(blog.id, {domain: ''}, function(err){

    if (err) throw err;

    process.exit();
  });
});