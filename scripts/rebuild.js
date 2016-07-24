var eachEntry = require('./each/entry');
var Entry = require('../app/models/entry');
var helper = require('../app/helper');
var forEach = helper.forEach;

var identifiers = process.argv.slice(2);
var get = require('./blog/get');

if (!identifiers.length) throw 'No identifier passed to script';

var only = [];

forEach(identifiers, function(id, next){

  get(id, function(user, blog){

    only.push(blog.id);

    next();
  });

}, function(){

  var options = {o: only};

  eachEntry(function(user, blog, entry, next){

    if (entry.deleted) return next();

    Entry.build(blog, entry.path, function(err, newEntry){

      if (err && err.code === 'ENOENT') {
        console.warn('No local file exists for entry', entry.path);
        return next();
      }

      // don't know
      if (err) {
        console.log('-----> REBUILD ERROR');
        console.log(err);
        if (err.stack) console.log(err.stack);
        if (err.trace) console.log(err.trace);
        return next();
      }

      Entry.save(blog.id, newEntry, next);
    });
  }, process.exit, options);
});