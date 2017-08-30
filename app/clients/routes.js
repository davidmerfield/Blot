var routes = require('express').Router();

routes.get('/', function (req, res) {
  res.send('wow!');
});

routes.use(function(req, res, next){

  res.dashboard = function(name) {
    res.renderDashboard(__dirname + '/dropbox/views/' + name + '.html');
  }

  next();
})
var dropbox = require('./dropbox').routes;

routes.use('/dropbox', dropbox);

module.exports = routes;