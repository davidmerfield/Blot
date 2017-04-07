var express = require('express');
var session = require('express-session');

var server = express();




var brochure = express();

brochure.get('/', function(req, res){res.send('BROCHURE HOMEPAGE <a style="appearance: button;" href="/auth">Sign in</a>');});

brochure.get('/auth', function(req, res){
  req.session.user = 1;
  res.redirect('/');
});

brochure.get('/contact', function(req, res){
  if (req.session.user) res.send('Logged in contact page');
  else res.send('Logged out contact page');
})


var dashboard = express();

dashboard.get('/', function(req, res){res.send('dashboard HOMEPAGE <a style="appearance: button;" href="/logout">Log out</a>');});

dashboard.get('/secret', function(req, res){res.send('SECRET!!!');});

dashboard.get('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});



var site = express();

site.use(session({
  secret: 'keyboard cat',
  resave: false,
  cookie: { secure: false }
}));

site
  .use(authenticated(dashboard))
  .use(brochure)
  .use(function(req, res){

    if (req.url === '/secret') return res.redirect('/auth');
  });






var blogs = express();

blogs.use(function(req, res){res.send('BLOGS!')});

server.use(site);
// server.use(blogs);

function authenticated (app) {

  return function (req, res, next) {

    if (!req.session.user) return next();

    return app(req, res, next);
  }
}

function unauthenticated (app) {

  return function (req, res, next) {

    if (req.session.user) return next();

    return app(req, res, next);
  }
}

server.listen(8888);
console.log('listening http://localhost:8888');