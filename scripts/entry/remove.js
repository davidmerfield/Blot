var get = require('../blog/get');
var Entry = require('entry');

var entry;
var handle = process.argv[2];
var entryPath = process.argv[3];

if (!handle) throw 'Missing first argument: handle for an existing blog';
if (!entryPath) throw 'Missing second argument: path to an entry on this blog';

get(handle, function(user, blog){

  if (!user || !blog) throw new Error('NOBLOG');

  Entry.get(blog.id, [entryPath], function(entries){

    entry = entries[0];

    if (!entry) throw new Error('NOENTRY');

    Entry.drop(blog.id, entryPath, function(err){

      if (err) throw err;

      console.log(blog.handle, entry.path, 'was deleted!');
    });
  });
});