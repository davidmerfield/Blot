var Blog = require('../../app/models/blog');
var get = require('./get');

var handle = process.argv[2];
var folder = process.argv[3];

if (folder[0] !== '/') throw folder + ' is not a valid folder';

get(handle, function(user, blog){

  console.log('Folder for', blog.handle, 'is currently', blog.folder);

  blog.folder = folder;

  Blog.set(blog.id, {folder: blog.folder}, function(err){

    if (err) throw err;

    console.log('Folder is now', blog.folder);
    process.exit();
  });
});
