var pushover = require('pushover');
var repos = pushover(__dirname + '/data', {autoCreate:true, checkout: true});
var Router = require('express').Router();

// This endpoint is exposed

Router.use('/end', function(req, res){
  repos.handle(req, res);
});

repos.on('push', function (push) {

  console.log(push);

  push.accept();

});

module.exports = Router;