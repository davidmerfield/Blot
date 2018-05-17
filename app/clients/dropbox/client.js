var join = require('path').join;
var Dropbox = require('dropbox');
var database = require('./database');
var helper = require('helper');
var ensure = helper.ensure;

module.exports = {

  disconnect: function(blogID, callback) {
    database.drop(blogID, callback);
  },

  write: function (blogID, path, contents, callback) {

    ensure(blogID, 'string')
      .and(path, 'string')
      .and(contents, 'string')
      .and(callback, 'function');

    database.get(blogID, function(err, account){

      var client = new Dropbox({accessToken: account.access_token});

      client.filesUpload({
        contents: contents,
        autorename: false,
        mode: {'.tag': 'overwrite'},
        path: join(account.folder || '/', path)
      })
        .then(function(res){
          if (!res) return callback(new Error('No response from Dropbox'));
          callback();
        })
        .catch(function(err){

          callback(err);
        });
    });
  },

  remove: function (blogID, path, callback) {

    ensure(blogID, 'string')
      .and(path, 'string')
      .and(callback, 'function');

    database.get(blogID, function(err, account){

      var client = new Dropbox({accessToken: account.access_token});

      client.filesDelete({
        path: join(account.folder || '/', path)
      })
        .then(function(res){
          if (!res) return callback(new Error('No response from Dropbox'));
          callback(null);
        })
        .catch(function(err){

          // The file does not exist
          if (err.status === 409) return callback();

          callback(err);
        });
    });
  }
};