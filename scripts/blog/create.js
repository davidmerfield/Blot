var Blog = require('blog');
var validate = require('../../app/models/blog/validate/handle');
var get = require('./get');
var existing_handle, new_handle, new_blog;

existing_handle = process.argv[2];
new_handle = process.argv[3];

if (!existing_handle) throw 'Missing first argument: handle for an existing blog';
if (!new_handle) throw 'Missing second argument: a handle for new blog';

validate('', new_handle, function(err, new_handle){

  if (err) throw err;

  get(existing_handle, function(user, existing_blog){

    if (!user || !existing_blog) throw 'There is no existing blog matching the handle \'' + existing_handle + '\'';

    console.log('Creating blog', new_handle, 'for user', user.email, '(' + user.uid + ')');

    new_blog = {handle: new_handle, timeZone: existing_blog.timeZone};

    Blog.create(user.uid, new_blog, function(err, new_blog){

      if (err) throw err;

      console.log('Created blog', new_handle, '!');
    });
  });
});