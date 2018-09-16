var helper = require('helper');
var ensure = helper.ensure;
var Log = helper.logg;
var buildFromFolder = require('../../../modules/template').update;
var get = require('../get');
var flushCache = require('../flushCache');
var Lease = require('./lease');

var ERROR = {
  DISABLED: 'disabled their account, do not sync',
  NO_USER: 'does not have a Blot account'
};

require('./check');

// This function is called when all we know
// is a UID and that we want Blot to sync it.
function sync (blogID, main, callback) {

  ensure(blogID, 'string')
    .and(main, 'function')
    .and(callback, 'function');

  var options = {};

  get({id: blogID}, function(err, blog){

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

    var title = blog.title + '’s folder';
    var prefix = helper.makeUid(5) + ':' + blog.id;
    var timer_label = prefix + ' Completed sync for ' + title + ' in';
    var logger = console.log.bind(this, prefix);

    logger('Trying to acquire sync lock for', title);

    Lease.request(blogID, function(err, available){

      if (err) return callback(err);

      if (!available) {
        logger('Failed to acquire sync lock for', title);
        return callback();
      }

      logger('Starting sync for', title);
      console.time(timer_label);

      main(function(sync_err){

        console.timeEnd(timer_label);

        flushCache(blogID, function(err){

          if (err) return callback(err);

          Lease.release(blogID, function(err){

            if (err) return callback(err);

            if (sync_err) {
              logger('Sync error:');
              logger(sync_err);
              if (sync_err.trace) logger(sync_err.trace);
              if (sync_err.stack) logger(sync_err.stack);
              return callback(sync_err);
            }

            buildFromFolder(blog.id, function(err){

              if (err) return callback(err);

              // Check to see if someone else requested
              // a lease during the sync. If so, that means
              // we recieved another webhook for this folder
              // and need to sync at least ONE. MORE. TIME.
              Lease.again(blogID, function(err, retry){

                if (err) return callback(err);

                if (!retry) return callback();

                logger('We recieved a webhook for this user during last sync, sync again...', title);
                return sync(blogID, main, callback);
              });
            });
          });
        });
      });
    });
  });
}

sync.change = require('./change');
sync.reset = require('./reset');

module.exports = sync;