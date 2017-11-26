var eachBlog = require('../each/blog');
var request = require('request');

eachBlog(function(user, blog, next){

  if (user.isDisabled || blog.isDisabled) return next();

  if (!blog.domain) {
    console.log('x http://'+ blog.handle +'.blot.im');
    return next();
  }

  var options = {

    // Change this to https is the
    // user requries SSL to visit blog
    uri: 'http://' + blog.domain + '/verify/domain-setup',

    timeout: 1000,

    // The request module has a known bug
    // which leaks memory and event emitters
    // during redirects. We cap the maximum
    // redirects to 5 to avoid encountering
    // errors when it creates 10+ emitters
    // for a URL with 10+ redirects...
    maxRedirects: 5
  };

  request(options, function(err, res, body){

    if (err) {return next();}

    if (body !== blog.handle) return next();

    console.log('YES https://' + blog.domain + ' (' + blog.handle + ')');

    next();
  });

}, process.exit);