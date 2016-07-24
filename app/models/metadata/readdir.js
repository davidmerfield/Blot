var fs = require('fs');
var helper = require('../../helper');
var ensure = helper.ensure;
var basename = require('path').basename;
var joinPath = require('path').join;
var client = require('../client');

var localPath = helper.localPath;
var key = require('./_key');

module.exports = function (blogID, dir, callback){

  ensure(blogID, 'string')
    .and(dir, 'string')
    .and(callback, 'function');

  var localDir = localPath(blogID, dir);

  fs.readdir(localDir, function(err, contents){

    // This will throw an error for
    // users with no public folder or
    // for a folder which does not exist
    // inside a user's public folder
    if (err) return callback(err, [], dir);

    contents = contents || [];

    var keys = [];

    // Ignore dotfiles
    contents = contents.filter(function(n){
      return n.indexOf('.') !== 0;
    });

    contents.forEach(function(name, i, contents){

      var path = joinPath(dir, name);

      contents[i] = path;

      keys.push(key.path(blogID, path));
    });

    client.get(key.path(blogID, dir), function(err, prettyDir){

      client.mget(keys, function(err, response){

        response = response || [];

        dir = prettyDir || dir;

        for (var i = 0; i < response.length; i++) {

          var path = response[i] || contents[i];

          contents[i] = {
            name: basename(path),
            path: path
          };
        }

        // Sort the files alphabetically
        contents = contents.sort(function(a, b){

          var A = a.name.toLowerCase();
          var B = b.name.toLowerCase();

          if (A < B) return -1;

          if (A > B) return  1;

          return 0;
        });

        return callback(null, contents, dir);
      });
    });
  });
};