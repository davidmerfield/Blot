var Sync = require('sync');
var debug = require('debug')('clients:dropbox:lock_on_folder');

module.exports = {

  acquire: function (req, res, next) {

    debug('attempting to grab sync');

    Sync(req.blog.id, function(change, callback){

      // beware, this might be called twice...

      debug('main function invoked');
      req.on_complete = callback;
      next();

    }, function(){

      debug('Sync released properly!');

    });

  },

  release: function (req, res, next) {
    
    debug('Calling sync on_complete!');
    req.on_complete();
    next();
  }
};