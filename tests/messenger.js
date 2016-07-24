var express = require('express');
var app = express();
var config = require('../config');

var session = require('express-session');
var redis = require('redis').createClient();
var Store = require('connect-redis')(session);

var sessionOptions = {
  secret: config.sessionSecret,
  rolling: true,
  saveUninitialized: false,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: config.environment !== 'development'
  },
  store: new Store({
    client: redis,
    port: config.redis.port
  })
};

app.use(session(sessionOptions));
app.use(messenger);

function template (req) {
  return 'ID? ' + req.session.uid + '<br /> Message? ' + req.message + '<br /><br />';
}

app.get('/test', function(req, res, next){
  res.send(req.message || 'No message!');
});

app
  .route('/')
  .get(function(req, res){


    res.send('<html>' + template(req) + ' <form method="post"><input type="submit"></form> <br /><a href="/logout">Log out</a> &bull; <a href="/auth">Sign in</a></html>');
  })
  .post(function(req, res){

    res.message({success: 'SUCCESS!', url: '/test'});

    res.redirect('/test?foo=bar');
  });

app.get('/auth', function(req, res, next){
  req.session.uid = 'DAVID';
  return res.redirect('/');
});

app.get('/logout', function(req, res, next){
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.listen(8888);
console.log('listening! 8888');

function messenger (req, res, next) {

  if (!req.session) return next();

  res.message = function (obj) {

    req.session = req.session || {};
    req.session.message = req.session.message || {};

    for (var i in obj)
      req.session.message[i] = obj[i];

    if (!req.session.message.url) {
      req.session.message.url = req.route.path;
    }

    console.log('Message URL is', req.session.message.url);

  };


  var message = req.session.message || {};

  delete req.session.message;

  if (message.url === req.path) {
    console.log('appending message!', message.success);
    req.message = message.success;
  } else {
    console.log("NO MATCH");
    console.log('MESSAGE URL', message.url);
    console.log('REQ ROUTE', req.url);
  }

  return next();
};