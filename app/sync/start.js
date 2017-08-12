var helper = require('../helper');
var ensure = helper.ensure;
var Log = helper.logg;

var Lease = require('./lease');
var cache = require('../cache');
var Blog = require('blog');
var sync = require('./dropbox');

var ERROR = {
  DISABLED: 'disabled their account, do not sync',
  NO_USER: 'does not have a Blot account'
};

// This function is called when all we know
// is a UID and that we want Blot to sync it.
function start (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var options = {};

  Blog.get({id: blogID}, function(err, blog){

    if (!blog || !blog.id)
      return callback(blogID + ' ' + ERROR.NO_BLOG);

    if (blog.isDisabled)
      return callback(blogID + ' ' + ERROR.DISABLED);

    // Tag all the logs for this sync process
    var log = new Log({uid: blogID, process: 'Sync'});

    // Allow debug passed in options
    if (options.debug) log.debug = log;

    // Pass in option logging function
    options.log = options.log || log;

    var title = blog.title + '\'s folder';
    var label = 'Synced ' + title + ' in';

    Lease.request(blogID, function(err, available){

      if (err) return callback(err);

      if (!available) return callback();

      console.log();
      console.log('Syncing', title, '(' + blog.id + ')');
      console.time(label);

      sync(blogID, options, function(){

        console.timeEnd(label);

        cache.clear(blogID, function(){

          // console.log('Releasing lease for', title);
          Lease.release(blogID, function(err){

            if (err) return callback(err);

            // Check to see if someone else requested
            // a lease during the sync. If so, that means
            // we recieved another webhook for this folder
            // and need to sync at least ONE. MORE. TIME.
            Lease.again(blogID, function(err, retry){

              if (err) return callback(err);

              if (!retry) return callback();

              console.log('We recieved a webhook for this user during last sync, sync again...', title);
              return start(blogID, callback);
            });
          });
        });
      });
    });
  });
}

module.exports = start;