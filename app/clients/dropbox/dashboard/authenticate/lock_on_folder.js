var Blog = require('blog');
var debug = require('debug')('clients:dropbox:lock_on_folder');

module.exports = {

  acquire: function (req, res, next) {

    debug('attempting to grab sync');

    Blog.sync(req.blog.id, function(callback){

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