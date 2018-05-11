var pushover = require('pushover');
var repos = pushover(__dirname + '/data', {autoCreate:true});
var Router = require('express').Router();

Router.use('/end', function(req, res){
  repos.handle(req, res);
});

module.exports = Router;