var Blog = require('../../app/models/blog');
var get = require('./get');
var User = require('../../app/models/user');

var handle = process.argv[2];
var folder = process.argv[3];

get(handle, function(user, blog){

  console.log('Folder for', blog.handle, 'is currently', blog.folder);

  if (!folder) return User.makeClient(user.uid, function(err, client){

    if (err) throw err;

    client.readdir('/', function(err, contents){

      if (err) throw err;

      console.log('available folders:');
      console.log(contents);
    });
  });

  if (folder[0] !== '/') throw folder + ' is not a valid folder';

  blog.folder = folder;

  Blog.set(blog.id, {folder: blog.folder}, function(err){

    if (err) throw err;

    console.log('Folder is now', blog.folder);
    process.exit();
  });
});
