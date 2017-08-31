var change_folder = require('express').Router();
var Dropbox = require('dropbox');

change_folder.get('/', function(req, res, next) {

  var client = new Dropbox({accessToken: req.account.token});

  req.params.path = '';

  client.filesListFolder({path: req.params.path})
    .then(function(response){
      console.log(response);
      res.locals.entries = response.entries;
      res.dashboard('change_folder');
    })
    .catch(function(err){
      next(err);
    });
});

module.exports = change_folder;
