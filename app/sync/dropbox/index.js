
var helper = require('../../helper');
var ensure = helper.ensure;
var time = helper.time;

var User = require('../../models/user');

var handle = require('./handle');
var get = require('./fetch');
var model = require('./model');

module.exports = function (uid, options, callback) {

  ensure(uid, 'string')
    .and(options, 'object')
    .and(callback, 'function');

  time('delta');

  get(uid, options, function(err, changes, state){

    time.end('delta');

    if (err) return callback(err);

    // Nothing has changed so we leave early
    if (!changes.length) return callback();

    // We save the state before dealing with the changes
    // to avoid an infinite loop if one of these changes
    // causes an exception. If sync enounters an exception
    // it will verify the folder at a later date
    User.set(uid, {folderState: state}, function(err){

      if (err) throw err;

      // No we make sure that the changes
      // from dropbox conform to what we expect
      // There was a bug where json.parse(json.string(change))
      // was not equal to the change. so we do this in advance
      var new_changes = [];

      changes.forEach(function(c){
        new_changes.push(model(c));
      });

      time('handle');

      handle(uid, new_changes, function(err){

        time.end('handle');

        callback(err);
      });
    }, {silent: true});
  });
};