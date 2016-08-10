// If there is an authenticated user associated with this request
// then append the user's information to the request
// so that other routes can make use of it easily

var config = require('../config'),
    forEach = require('./helper').forEach,
    csrf = require('csurf'),
    Blog = require('./models/blog'),
    User = require('./models/user');

function check (request, response, next) {

  requireSSL(request, response, function(error){

    if (error) return next(error);

    var host = config.host;

    if (request.hostname !== host ||
       !request.session || !request.session.uid) {

      request.user = false;

      return next();
    }

    // Don't expose any features which modify the
    // database when the
    if (config.maintenance && request.url !== '/maintenance') {
      return response.redirect('/maintenance');
    }

    var uid = request.session.uid;

    User.getBy({uid: uid}, function(error, user){

      if (error) return next(error);

      if (!user) {
        return next();
      }

      var blogs = [];

      forEach(user.blogs, function(blogID, nextBlog){

        Blog.get({id: blogID}, function(err, blog){
          blogs.push(blog);
          nextBlog();
        });

      }, function(){

        request.user = user;

        // Lets append the user and
        // set the partials to 'logged in mode'
        response.addLocals({user: user});

        response.setPartials({
          head: 'dashboard/_head',
          footer: 'dashboard/_footer',
          nav: 'dashboard/_nav',
          status: 'dashboard/_status'
        });

        // Need to allow post requests
        if (user.isUnpaid || user.isPastDue) {

          // to view pay page
          if (request.url === '/pay-subscription')
            return next();

          // or to submit their new payment
          if (request.method === 'POST')
            return next();

          // otherwise make them pay muah ha ha.
          return response.redirect('/pay-subscription');
        }

        if (!request.session.blogID) {

          if (request.method === 'POST')
            return next();

          if (request.url === '/create-blog')
            return next();

          if (user.blogs.length === 0)
            return response.redirect('/create-blog');

          return next();
        }

        var blogID = request.session.blogID;

        Blog.get({id: blogID}, function(error, blog){

          if (error || !blog) return next(error);

          blogs.forEach(function(_blog){

            if (_blog.id === blogID)
              _blog.isCurrent = true;

          });

          request.blog = Blog.extend(blog);
          request.blogs = blogs;

          response.addLocals({
            blog: blog,
            blogs: blogs
          });

          next();
        });
      });
    });
  });
}

function enforce (request, response, next) {

  check(request, response, function(error){

    if (error) return next(error);

    // Store the path to visit once auth complete
    if (!request.user) {
      request.session.afterAuth = request.url;
      return response.redirect('/auth');
    }

    // THIS SETS A SESSION?
    csrf()(request, response, function(){

      // Load the CSRF protection since we're
      // inside the app,
      response.addLocals({
        csrftoken: request.csrfToken()
      });

      return next();
    });
  });
}

// Prevent logged in users from accessing this page
function exclude (request, response, next){

  check(request, response, function(error){

    if (error) return next(error);

    if (request.user) {
      return response.redirect('/');
    }

    return next();
  });
}

// Only let users with admin UIDs through
function admin (request, response, next) {

  enforce(request, response, function(error){

    if (error) return next(error);

    if (request.user.uid !== config.admin.uid) return next('404');

    return next();
  });
}

function requireSSL (request, response, next) {

  if (!request.secure)
    return response.redirect('https://' + config.host + request.url);

  next();
}

module.exports = {
  check: check,
  enforce: enforce,
  admin: admin,
  exclude: exclude,
  requireSSL: requireSSL
};