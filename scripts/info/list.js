var eachBlog = require('../each/blog');
var request = require('request');

var custom_domain = {custom: []};
var sub_domain = {custom: []};

eachBlog(function(user, blog, next){

  if (user.isDisabled || blog.isDisabled) return next();

  console.log('...', blog.handle);

  if (!blog.domain) {

    if (blog.template.indexOf('SITE') !== -1) {
      sub_domain[blog.template] = sub_domain[blog.template] || [];
      sub_domain[blog.template].push(blog.handle);
    } else {
      sub_domain.custom.push(blog.handle);
    }

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

    if (blog.template.indexOf('SITE') !== -1) {
      blog.template = blog.template.slice('SITE:'.length);
      custom_domain[blog.template] = custom_domain[blog.template] || [];
      custom_domain[blog.template].push(blog.domain);
    } else {
      custom_domain.custom.push(blog.domain);
    }

    next();
  });

}, function(){

  console.log();
  console.log();
  console.log();
  console.log('CUSTOM DOMAINS');
  console.log('--------------');

  for (var i in custom_domain) {

    var list = custom_domain[i];

    console.log(i);

    list.forEach(function(d){
      console.log('- https://' + d);
    });

    console.log();

  }

  // console.log('SUB DOMAINS');
  // console.log('-----------');
  // console.log(sub_domain);
});