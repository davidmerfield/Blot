var Blog = require('blog');
var User = require('user');
var validate = require('../../app/models/blog/validate/handle');
var email, new_handle, new_blog;

email = process.argv[2];
new_handle = process.argv[3];

if (!email) throw 'Missing email address of user';
if (!new_handle) throw 'Missing second argument: a handle for new blog';

validate('', new_handle, function(err, new_handle){

  if (err) throw err;

  User.getByEmail(email, function(err, user){

    if (err || !user) throw 'There is no user \'' + email + '\'';

    console.log('Creating blog', new_handle, 'for user', user.email, '(' + user.uid + ')');

    new_blog = {handle: new_handle};

    Blog.create(user.uid, new_blog, function(err){

      if (err) throw err;

      console.log('Created blog', new_handle, '!');
    });
  });
});