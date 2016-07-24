var helper = require('../helper');
var forEach = helper.forEach;
var ensure = helper.ensure;
var Log = helper.logg;

var Lease = require('./lease');

var cache = require('../cache');

var User = require('../models/user');
var sync = require('./dropbox');

var ERROR = {
  DISABLED: 'disabled their account, do not sync',
  NO_USER: 'does not have a Blot account'
};

// This function is called when all we know
// is a UID and that we want Blot to sync it.
function start (uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  var options = {};

  User.getBy({uid: uid}, function(err, user){

    if (!user || !user.uid)
      return callback(uid + ' ' + ERROR.NO_USER);

    if (user.isDisabled)
      return callback(uid + ' ' + ERROR.DISABLED);

    // Tag all the logs for this sync process
    var log = new Log({uid: uid, process: 'Sync'});

    // Allow debug passed in options
    if (options.debug) log.debug = log;

    // Pass in option logging function
    options.log = options.log || log;

    var title = user.name + '\'s folder';
    var label = 'Synced ' + title + ' in';

    Lease.request(uid, function(err, available){

      if (err) return callback(err);

      if (!available) return callback();

      console.log();
      console.log('Syncing', title, '(' + user.uid + ')');
      console.time(label);

      sync(uid, options, function(){

        console.timeEnd(label);

        forEach(user.blogs, function(blogID, nextBlog){

          cache.clear(blogID, nextBlog);

        }, function(){

          // console.log('Releasing lease for', title);
          Lease.release(uid, function(err){

            if (err) return callback(err);

            // Check to see if someone else requested
            // a lease during the sync. If so, that means
            // we recieved another webhook for this folder
            // and need to sync at least ONE. MORE. TIME.
            Lease.again(uid, function(err, retry){

              if (err) return callback(err);

              if (!retry) return callback();

              console.log('We recieved a webhook for this user during last sync, sync again...', title);
              return start(uid, callback);
            });
          });
        });
      });
    });
  });
}

module.exports = start;