var helper = require('../../helper');
var ensure = helper.ensure;
var time = helper.time;

var Blog = require('blog');
var handle = require('./handle');
var model = require('./model');

module.exports = function (blogID, options, callback) {

  ensure(blogID, 'string')
    .and(options, 'object')
    .and(callback, 'function');

  Blog.get({id: blogID}, function(err, blog){

    if (err) return callback(err);

    Blog.makeClient(blogID, function(err, client){

      if (err) return callback(err);

      // Use a blank slate if neccessary
      // Folderstate is a tag used by the Dropbox api
      // to compare what we know and what is the current
      var folderState = options.hard === true ? '' : blog.folderState;

      var changes = [];

      // We pass in a tag which tells Dropbox what we know
      // to be the previous state of a user's folder
      // so we don't get everything every time...
      client.delta(folderState, function onFetch (err, res){

        if (err || !res) return callback(err || new Error('No changes'));

        var more = res.shouldPullAgain;
        var newState = res.cursorTag;

        changes = changes.concat(res.changes || []);

        // If Dropbox says there are more changes
        // we get them before returning the callback.
        // This is important because a rename could
        // be split across two pages of file events.
        if (more) return client.delta(newState, onFetch);

        // Nothing has changed so we leave early
        if (!changes.length) return callback();

        // We save the state before dealing with the changes
        // to avoid an infinite loop if one of these changes
        // causes an exception. If sync enounters an exception
        // it will verify the folder at a later date
        Blog.set(blogID, {folderState: newState}, function(err){

          if (err) throw err;

          // No we make sure that the changes
          // from dropbox conform to what we expect
          // There was a bug where json.parse(json.string(change))
          // was not equal to the change. so we do this in advance
          changes = changes.map(model);

          time('handle');

          handle(blog, client, changes, function(err){

            time.end('handle');

            callback(err);
          });
        });
      });
    });
  });
};