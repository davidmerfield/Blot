var express = require('express');
var server = express();
var hogan = require('hogan-express');
var compression = require('compression');
var fs = require('fs');

server.use(compression());
server.disable('x-powered-by');
server.set('trust proxy', 'loopback');

server.set('view engine', 'html');
server.set('views', __dirname + '/views');
server.engine('html', hogan);

// Render index page listing
// all the versions of the marketing site
server.use(function(req, res, next){

  if (req.hostname.indexOf('.') !== -1) return next();

  var html = fs.readdirSync(__dirname + '/views').filter(function(dir){
  
    return dir[0] !== '.';
  
  }).map(function(dir){

    return '<a target="_blank" href="http://' + dir + '.localhost:9999">' + dir + '</a>';
    
  }).join('<br>');

  res.send(html);
});

server.use(function(req, res, next){
  
  var version = req.hostname.slice(0, req.hostname.indexOf('.'));

  req.version = res.locals.version = version;

  res.locals.partials = {
    head: version + '/_head',
    header: version + '/_header',
    footer: version + '/_footer'    
  };

  res.renders = function(view) {
    res.render(version + '/' + view);
  };

  next();
});

server.use(require('./routes'));

server.use(function(req, res, next){
  express.static(__dirname + '/views/' + req.version)(req, res, next);
});

server.listen('9999');