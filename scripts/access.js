var Blog = require('../app/models/blog');
var User = require('../app/models/user');
var format = require('url').format;
var config = require('../config');
var handle = process.argv[2];

Blog.get({handle: handle}, function(err, blog){

  if (err) throw err;

  User.generateAccessToken(blog.owner, function(err, token){

    if (err) throw err;

    // The full one-time log-in link to be sent to the user
    var url = format({
      protocol: 'https',
      host: config.host,
      pathname: '/log-in',
      query: {
        token: token
      }
    });

    console.log(blog.title, blog.domain, blog.handle);
    console.log('-----------------------------------');
    console.log('1.', format({
      protocol: 'https',
      host: config.host,
      pathname: '/account/log-out'
    }));
    console.log('2.', url);
  });
});