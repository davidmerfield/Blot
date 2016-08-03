var helper = require('../../../helper');
var Entry = require('../../../models/entry');
var localWelcome = helper.rootDir + '/app/welcome.txt';
var localPath = helper.localPath;
var welcomePath = '/welcome.txt';
var copyFile = helper.copyFile;
var User = require('../../../models/user');
var ensure = helper.ensure;
var fs = require('fs');

function writeWelcome (uid, folder, callback) {

  callback = callback || function(){};

  ensure(uid, 'string')
    .and(folder, 'string')
    .and(callback, 'function');

  User.makeClient(uid, function(err, client){

    if (err) return console.log(err);

    var welcomePath = folder + '/welcome.txt';
        welcomePath = welcomePath.split('//').join('/');

    var retrys = 0;

    fs.readFile(localWelcome, function(err, contents){

      if (err) throw err;

      // Write the first entry to the user's dropbox as well
      client.writeFile(welcomePath, contents, function tryAgain (error){

        if (error && error.status == 503 && retrys < 5) {

          retrys++;
          console.log('Retrying write welcome file after delay...');

          return setTimeout(function(){
            console.log('Retrying write welcome right now...');
            client.writeFile(welcomePath, contents, tryAgain);
          }, 2000);
        }

        callback();
      });
    });
  });
}

module.exports = function (uid, blog, callback) {

  ensure(uid, 'string')
    .and(blog, 'object')
    .and(callback, 'function');

  copyFile(localWelcome, localPath(blog.id, welcomePath), function(err){

    if (err) throw err;

    // Turn the welcome file into an entry immediately
    Entry.build(blog, welcomePath, function(err, welcomeEntry){

      if (err) throw err;

      // Create the first entry instantly
      Entry.set(blog.id, welcomeEntry.id, welcomeEntry, function(){

        console.log('Blog:', blog.id + ':', 'Writing ' + welcomePath + ' to user\'s folder');

        // Write a welcome file to the folder
        writeWelcome(uid, blog.folder, callback);
      });
    });
  });
};