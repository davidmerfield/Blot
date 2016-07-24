var Entry = require('../models/entry');
var redis = require('redis').createClient();
var Emit = require('./emit');
var helper = require('../helper');
var ensure = helper.ensure;
var randomString = helper.makeUid.bind(this, 10);


module.exports = function (blogID, firstID, secondID, callback) {

  ensure(blogID, 'string')
    .and(firstID, 'number')
    .and(secondID, 'number')
    .and(callback, 'function');

  var emit = Emit(blogID);
  var ids = [firstID, secondID];

  Entry.get(blogID, ids, function(entries){

    var firstEntry = entries[0];
    var secondEntry = entries[1];

    var showEntry;
    var hideEntry;

    if (firstEntry.updated > secondEntry.updated) {
      showEntry = firstEntry;
      hideEntry = secondEntry;
    } else {
      showEntry = secondEntry;
      hideEntry = firstEntry;
    }

    var oldPath = hideEntry.path;
    var newPath = oldPath + randomString();

    var oldPathKey = Entry.key.path(blogID, oldPath);
    var newPathKey = Entry.key.path(blogID, newPath);

    showEntry.updated = hideEntry.updated = Date.now();

    hideEntry.path = newPath;
    hideEntry.deleted = true;

    redis.set(oldPathKey, showEntry.id, function(err){

      if (err) throw err;

      redis.set(newPathKey, hideEntry.id, function(err){

        if (err) throw err;

        Entry.set(blogID, hideEntry.id, hideEntry, function(err){

          if (err) throw err;

          Entry.set(blogID, showEntry.id, showEntry, function(err){

            if (err) throw err;

            emit('> Hide entry ' + hideEntry.id + ' ' + hideEntry.path);
            emit('> Show entry ' + showEntry.id + ' ' + showEntry.path);

            callback();
          });
        });
      });
    });
  });
};
