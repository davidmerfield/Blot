module.exports = {};

// var helper = require('../../../helper');
// var ensure = helper.ensure;
// var cache = require('../../../cache');
// var Compare = require('./compare');

// var Blog = require('../../../models/blog');
// var Emit = require('./emit');

// var forEach = helper.forEach.multi(5);
// var localPath = helper.localPath;

// var joinPath = require('path').join;
// var rm = helper.remove;
// var download = require('../change/download');

// if (require.main === module) {

//   var blogID = process.argv[2];

//   if (!blogID) throw 'Please pass the user\'s handle as an argument.';

//   verify(blogID, process.exit);
// }

// function verify (blogID, callback) {

//   ensure(blogID, 'string')
//     .and(callback, 'function');

//   var emit = Emit(blogID);

//   Blog.get({id: blogID}, function(err, blog){

//     if (err || !blog)
//       throw err || 'No blog ' + blogID;

//     Blog.makeClient(blogID, function(err, client){

//       if (err || !client)
//         throw err || 'No client';

//       var compare = new Compare(blog, client, callback);

//       emit('Checking folder is in sync...');

//       compare('/', function(err, update, remove){

//         // the user might have removed their folder...
//         if (err) return callback(err);

//         forEach(update, function(path, nextFile){

//           var from = joinPath(blog.folder, path);
//           var to = localPath(blog.id, path);

//           // I should try and work out
//           // if this needs to be a placeholder
//           // instead of downloading ignoreable files?
//           emit('+ ' + path);
//           download(client, from, to, nextFile);

//         }, function(){

//           forEach(remove, function(path, nextFile){

//             emit('x ' + path);
//             rm(localPath(blog.id, path), nextFile);

//           }, function(){

//             emit('✓ Folder is in sync');

//             // Then we're done!
//             cache.clear(blogID, callback);
//           });
//         });
//       });
//     });
//   });
// }

// module.exports = verify;