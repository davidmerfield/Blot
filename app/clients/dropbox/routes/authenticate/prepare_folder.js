module.exports = function (blog_id, account_id, callback) {
  return callback(null, '/');
};


// var helper = require('helper');
// var Blog = require('blog');
// var normalize = helper.pathNormalizer;
// var ensure = helper.ensure;
// var forEach = helper.forEach.multi(10);
// var join = require('path').join;
// var UID = helper.makeUid;
// var TEMPORARY_FOLDER = '.blot-temporary-folder-';
// var TRY_AGAIN = [
//   0, 500, 504, // network error
//   429, 503     // rate limit error
// ];

// var INIT_DELAY = 100;
// var MAX_ATTEMPTS = 10;

// function shouldRetry (error) {
//   return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
// }

// module.exports = function (client, newBlog, oldBlogs, callback) {

//   ensure(client, 'object')
//     .and(newBlog, 'object')
//     .and(oldBlogs, 'array')
//     .and(callback, 'function');

//     database.getBlogsByAccountID(, function(err, blogs){

//       if (err) return next(err);

//       var folder;

//       if (blogs.length > 0) {
//         folder = '/' + req.blog.handle;
//       } else {
//         folder = '/';
//       }

//   var folderForNewBlog =  oldBlogs.length ? '/' + newBlog.handle : '/';

//   // We only need to move files around if the user has
//   // a single blog. When the user has zero blogs, we just
//   // use the app folder as root ('/'). When the user has
//   // two or more blogs already connected to this Dropbox,
//   // they are neccessarily inside subfolders.
//   if (oldBlogs.length === 0) return callback(null, folderForNewBlog);

//   // We just need to create the new folder if the user already has two blogs
//   if (oldBlogs.length !== 1) return mkdir(client, folderForNewBlog, function(err){
//     callback(err, folderForNewBlog);
//   });

//   var oldBlog = oldBlogs[0];
//   var folderToMove = oldBlog.folder || '/';
//   var folderForOldBlog = '/' + oldBlog.handle;

//   // Keep the old blog in the same place if it was already
//   // in a subfolder for some reason. The MV function will
//   // not do anything and call the callback.
//   if (folderToMove !== '/') folderForOldBlog = folderToMove;

//   mv(client, folderToMove, folderForOldBlog, function(err){

//     if (err) return callback(err);

//     Blog.set(oldBlog.id, {folder: folderForOldBlog}, function(err){

//       if (err) return callback(err);

//       mkdir(client, folderForNewBlog, function(err){

//         if (err) return callback(err);

//         return callback(null, folderForNewBlog);
//       });
//     });
//   });
// };

// function mkdir (client, folder, callback) {

//   ensure(client, 'object')
//     .and(folder, 'string')
//     .and(callback, 'function');

//   ensure(folder, 'string').and(callback, 'function');

//   client.mkdir(folder, function then (err){

//     // There is already a folder at this path...
//     // which must have been created by the user in the meantime...
//     if (err && err.status === 403) return callback();

//     // Network or rate limit error
//     if (shouldRetry(err)) return mkdir(client, folder, callback);

//     return callback();
//   });
// }

// // This function checks that none of the folders inside
// // the user's folder are named the same as the folder
// // for the newly created blog. If so, then it moves the
// // conflicting folder first, to ensure that the state of the
// // user's blog folder is preserved in the new sub folder.
// // Let's say the user's blog folder contained a single subolder
// // called 'foo'. If the user creates a blog called 'foo', then
// // we need to move 'foo' to '/foo/foo'. Since we can't move a folder
// // into itself we need to make a temp folder first...
// // We don't need to worry about the second blog folder since it
// // doesn't exist yet...
// function mv (client, from, to, callback) {

//   ensure(client, 'object')
//     .and(from, 'string')
//     .and(to, 'string')
//     .and(callback, 'function');

//   if (from === to) return callback(null);

//   // Unfortuneately I haven't found an easy way to move
//   // everything in the top level directory into a sub folder.
//   // If I do, you can remove all the bs below.
//   client.readdir(from, function(err, stat, contents){

//     if (err) return callback(err);

//     // I believe we do this so we preserve
//     // the case of folder contents?
//     contents = contents._json.contents;

//     // If the existing blog is empty, all we need to create
//     // a blank folder for it so the user is not confused.
//     if (!contents.length) return mkdir(client, to, callback);

//     // Determine if the new blog folder already exists
//     // in the users folder. We'll then move this before
//     // the rest of the files to preserve the folder structure
//     var conflict = false;

//     // We use the reverse loop trick because we might want
//     // to splice some of the items out of contents...
//     contents.forEach(function(item){
//       if (normalize(item.path) === normalize(to)) conflict = true;
//     });

//     // There is no folder named the same as the first blog's handle.
//     if (!conflict) {
//       console.log('THERE IS NO CONFLICT', to.toLowerCase(), contents);
//       return moveContents(client, contents, to, callback);
//     }

//     console.log('THERE IS A CONFLICT');

//     // We put a dot up front so the folder is hidden on
//     // OSX. It should only exist for a second or so...
//     var temp = TEMPORARY_FOLDER + UID(6);

//     moveContents(client, contents, temp, function(err){

//       if (err) return callback(err);

//       move(client, temp, to, function(err){

//         if (err) return callback(err);

//         callback();
//       });
//     });
//   });
// }

// function move (client, from, to, callback) {

//   ensure(client, 'object')
//     .and(from, 'string')
//     .and(to, 'string')
//     .and(callback, 'function');

//   var delay = INIT_DELAY;
//   var attempts = 1;

//   if (from === to) return callback();

//   client.move(from, to, function done (err){

//     if (shouldRetry(err) && attempts < MAX_ATTEMPTS) {

//       attempts++;
//       delay *= 2;

//       return setTimeout(function(){

//         client.move(from, to, done);

//       }, delay);
//     }

//     // there is already a file at this path
//     if (err && err.status === 403) return callback();

//     // the file was removed between the readdir and now...
//     if (err && err.status === 404) return callback();

//     if (err) console.log(err);

//     callback();
//   });
// }

// function moveContents (client, contents, toFolder, callback) {

//   ensure(client, 'object')
//     .and(contents, 'array')
//     .and(toFolder, 'string')
//     .and(callback, 'function');

//   forEach(contents, function(item, next){

//     move(client, item.path, join(toFolder, item.path), next);

//   }, callback);
// }