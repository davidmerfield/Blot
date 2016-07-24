var User = require('../../models/user');
var makeClient = User.makeClient;
var ERROR = {NOTHING: 'No changes recieved'};

module.exports = function(uid, options, callback) {

  makeClient(uid, function(error, client){

    // Fetch the latest state of this user
    User.getBy({uid: uid}, function(err, user){

      // Use a blank slate if neccessary
      // Folderstate is a tag used by the Dropbox api
      // to compare what we know and what is the current
      var folderState = options.hard === true ? '' : user.folderState;

      var changes = [];

      // We pass in a tag which tells Dropbox what we know
      // to be the previous state of a user's folder
      // so we don't get everything every time...
      client.delta(folderState, function onFetch (err, res){

        if (err || !res)
          return callback(err || new Error(ERROR.NOTHING));

        var more = res.shouldPullAgain,
            newState = res.cursorTag;

        changes = changes.concat(res.changes || []);

        // If Dropbox says there are more changes
        // we get them before returning the callback.
        // This is important because a rename could
        // be split across two pages of file events.
        if (more) return client.delta(newState, onFetch);

        return callback(err, changes, newState);
      });
    });
  });
};
