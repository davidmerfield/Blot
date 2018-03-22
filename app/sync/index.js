var helper = require('helper');
var ensure = helper.ensure;
var Log = helper.logg;
var buildFromFolder = require('../modules/template').update;
var Blog = require('blog');
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

    console.log('Attempting to sync', blogID, title);

    Lease.request(blogID, function(err, available){

      if (err) return callback(err);

      if (!available) return callback();

      console.log();
      console.log('Syncing', title, '(' + blog.id + ')');
      console.time(label);

      main(function(sync_err){

        console.timeEnd(label);

        Blog.flushCache(blogID, function(err){

          if (err) return callback(err);

          console.log('Releasing lease for', title);
          Lease.release(blogID, function(err){

            if (err) return callback(err);

            if (sync_err) {
              console.log('Sync error:');
              console.log(sync_err);
              if (sync_err.trace) console.log(sync_err.trace);
              if (sync_err.stack) console.log(sync_err.stack);
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

                console.log('We recieved a webhook for this user during last sync, sync again...', title);
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

// // index.js
// var helper = require('../helper');
// var worker = helper.worker;
// var script = __dirname + '/main';

// module.exports = worker(script);

// // main.js
// var start = require('./start');

// // determine users who still have leases / again set
// // for each, sync then verify... but do this in a safe
// // seperate process.
// require('./check');

// process.on('message', function(blogID) {

//   start(blogID, function(err){

//     if (err) {
//       console.log(err);
//       if (err.stack) console.log(err.stack);
//       if (err.trace) console.log(err.trace);
//     }
//   });
// });

// console.log('Listening for sync messages...');