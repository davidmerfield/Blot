var helper = require('../../../helper');
var User = require('../../../models/user');
var Blog = require('../../../models/blog');
var ensure = helper.ensure;
var forEach = helper.forEach.multi(10);
var joinpath = require('path').join;
var UID = helper.makeUid;

module.exports = function (user, secondBlog, callback) {

  ensure(user, 'object')
    .and(secondBlog, 'object')
    .and(callback, 'function');

  // We only need to move files around if the user has
  // a single blog. When the user has zero blogs, or
  // two+ blogs, we just write the welcome file at the
  // next step to {{folder}}/welcome.txt. For one blog
  // folder is '/', for two+ blogs folder is '/{{handle}}'
  if (user.blogs.length !== 1) return callback();

  var firstBlogID = user.blogs[0];

  // We pass the ID of their current blog
  // so migrateFolders can determine its handle
  // this is async but we don't care...
  Blog.get({id: firstBlogID}, function(err, firstBlog){

    if (err || !firstBlog) return callback(err || 'No first blog');

    var firstBlogFolder = '/' + firstBlog.handle;

    console.log('Blog:', firstBlogID + ':', 'Folder migration into subfolder:', firstBlogFolder);

    // We store the new blog folder before actually moving
    // the files so that any webhooks which arrive during
    // this migration don't cause any issues...
    Blog.set(firstBlogID, {folder: firstBlogFolder}, function(err){

      if (err) return callback(err);

      User.makeClient(user.uid, function(err, client){

        if (err || !client) return callback(err || 'No client');

        var move = Move(client);

        // Unfortuneately I haven't found an easy way to move
        // everything in the top level directory into a sub folder.
        // If I do, you can remove all the bs below.
        client.readdir('/', function(err, stat, contents){

          if (err) return callback(err);

          // I believe we do this so we preserve
          // the case of folder contents?
          contents = contents._json.contents;

          // If the first blog is empty, we need to create
          // a blank folder for it to prevent the user from
          // becoming confused...
          if (!contents.length) {

            return client.mkdir(firstBlogFolder, function onMkdir (err){

              // There is already a folder at this path...
              // which must have been created by the user in the meantime...
              if (err && err.status === 403)
                return callback();

              // Network or rate limit error
              if (shouldRetry(err))
                return client.mkdir(firstBlogFolder, onMkdir);

              return callback();
            });
          }

          // This function checks that none of the folders inside
          // the user's folder are named the same as the folder
          // for the newly created blog. If so, then it moves the
          // conflicting folder first, to ensure that the state of the
          // user's blog folder is preserved in the new sub folder.

          // Let's say the user's blog folder contained a single subolder
          // called 'foo'. If the user creates a blog called 'foo', then
          // we need to move 'foo' to '/foo/foo'. Since we can't move a folder
          // into itself we need to make a temp folder first...
          // We don't need to worry about the second blog folder since it
          // doesn't exist yet...
          moveExistingBlogFolder(move, firstBlogFolder, contents, function(err){

            if (err) return callback(err);

            forEach(contents, function(item, next){

              var from = item.path;
              var to = joinpath(firstBlogFolder, from);

              move(from, to, next);

            }, function () {

              console.log('Blog:', firstBlogID + ':', 'Folder migration to', firstBlogFolder, ' is complete!');
              callback();
            });
          });
        });
      });
    });
  });
};

// Determine if the new blog folder already exists
// in the users folder. We'll then move this before
// the rest of the files to preserve the folder structure
function moveExistingBlogFolder (move, firstBlogFolder, contents, callback) {

  var conflictingFolder = null;

  var i = contents.length;

  // We use the reverse loop trick because we might want
  // to splice some of the items out of contents...
  while (i--) {

    if (contents[i].path.toLowerCase() === firstBlogFolder.toLowerCase()) {
      conflictingFolder = contents[i].path;
      contents.splice(i, 1);
    }
  }

  // There is no folder named the same as the first blog's handle
  // so we can leave early.
  if (!conflictingFolder) return callback();

  var from = conflictingFolder;

  // We put a dot up front so the folder is hidden on
  // OSX. It should only exist for a second or so...
  var toTemporary = '.blot-temporary-folder-' + UID(6);

  // We use both firstBlogFolder and from because the case
  // might be different ... they are probably the same...
  var to = joinpath(firstBlogFolder, from);

  move(from, toTemporary, function(err){

    if (err) return callback(err);

    move(toTemporary, to, function(err){

      if (err) return callback(err);

      callback();
    });
  });
}

var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503     // rate limit error
];

var INIT_DELAY = 100;
var MAX_ATTEMPTS = 10;

function shouldRetry (error) {
  return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
}

function Move (client) {

  return function (from, to, callback) {

    var delay = INIT_DELAY;
    var attempts = 1;

    client.move(from, to, function done (err){

      if (shouldRetry(err) && attempts < MAX_ATTEMPTS) {

        attempts++;
        delay *= 2;

        return setTimeout(function(){

          client.move(from, to, done);

        }, delay);
      }

      // there is already a file at this path
      if (err && err.status === 403) return callback();

      // the file was removed between the readdir and now...
      if (err && err.status === 404) return callback();

      if (err) console.log(err);

      callback();
    });
  };
}

