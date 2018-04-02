var pushover = require('pushover');
var repos = pushover(__dirname + '/repos', {autoCreate:true});
var Router = require('express').Router();

// This is called by Dropbox to verify
// the webhook is valid.
Router.use('/end', function(req, res){
  repos.handle(req, res);
});

module.exports = Router;