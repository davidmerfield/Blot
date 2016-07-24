var Entry = require('../../app/models/entry');
var eachEntry = require('../each/entry');
var helper = require('../../app/helper');
var ensure = helper.ensure;

var get = require('../blog/get');

var options = require('minimist')(process.argv.slice(2));
var path = options.p;


var identifier = options._[0] + '';
var path = options._[1];

console.log(options);
console.log(identifier, path);

get(identifier, function(user, blog){

  if (!user || !blog)
    throw 'No blog with identifier ' + identifier;

  main(blog, {path: path}, process.exit);
});

function main (blog, options, callback) {

  ensure(blog, 'object')
    .and(options, 'object')
    .and(callback, 'function');

  if (options.path)
    return single(blog, path, callback);

  return all(blog, callback);
}


function all (blog, callback) {

  ensure(blog, 'object')
    .and(callback, 'function');

  eachEntry(blog.id, function(user, blog, entry, next){

    rebuild(blog, entry.id, next);

  }, callback);
}

function single (blog, path, callback) {

  ensure(blog, 'object')
    .and(path, 'string')
    .and(callback, 'function');

  Entry.getByPath(blog.id, path, function(entry){

    if (!entry)
      throw blog.handle + ' has no entry with path ' + path;

    rebuild(blog, entry.id, callback);
  });
}


function rebuild (blog, entryID, callback) {

  ensure(blog, 'object')
    .and(entryID, 'number')
    .and(callback, 'function');

  Entry.get(blog.id, entryID, function(entry){

    if (!entry) {
      console.log('No entry with id', entryID);
      return callback();
    }

    // Otherwise this would
    // make the entry visible...
    if (entry.deleted) {
      console.log('Not rebuilding, entry is deleted.');
      return callback();
    }

    var path = entry.path;

    Entry.build(blog, path, function(err, entry){

      if (err && err.code === 'ENOENT') {
        console.log('No local file for entry with id', entryID, 'and path', path);
        return callback();
      }

      // don't know
      if (err) {
        console.log('-----> REBUILD ERROR ON APPS PAGE');
        console.log(err);
        if (err.stack) console.log(err.stack);
        if (err.trace) console.log(err.trace);
        return callback();
      }

      ensure(entryID, 'number')
        .and(entry, 'object');

      Entry.save(blog.id, entry, function(err){

        if (err) console.log(err);

        callback();
      });
    });
  });
}

