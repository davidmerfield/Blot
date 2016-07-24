var express = require('express');
var server = express();

var start = new Date();
var DONT_HANG = true;

var redis = require('redis').createClient();

var COUNTER = 'TEST-COUNTER';

server.use(function(req, res, next){


  if (DONT_HANG) {
    console.log(start, 'GET', req.url);
    return next();
  }

  console.log(start, 'HANGING', req.url);
});

server.get('/hang', function(req, res, next){
  DONT_HANG = false;
  return next();
});

server.get('/save', function(req, res){

  redis.get(COUNTER, function(err, total){

    if (err) throw err;

    total = total || 0;

    res.send('<!DOCTYPE html><meta charset="utf-8"><p>Server started ' + start + '</p><p>Total: ' + total + '</p><form method="post"><input type="submit">');
  });
});

server.post('/save', function(req, res){

  redis.incr(COUNTER, function(err, stat){

    if (err) throw err;

    console.log(start, 'INCREMENETED COUNTER', stat);

    res.redirect(req.path);
  });
});

server.get('/crash', function(){
  setTimeout(function(){
    throw new Error('CRASH');
  }, 1);
});

server.use(function (req, res) {
  res.send(start + ' ' + req.url + ' requested successfull!');
});

server.listen(8080);
console.log('Crashing server is now listening on 8080');