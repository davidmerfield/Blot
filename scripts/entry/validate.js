var Entry = require('../../app/models/entry');
var eachEntry = require('../each/entry');

var _ = require('lodash');
var assert = require('assert');

var helper = require('../../app/helper');
var type = helper.type;
var fakeEntry = require('./fakeEntry');

var ensure = helper.ensure;
var options = require('minimist')(process.argv.slice(2));

var debug = require('./debug');

var log = require('single-line-log').stdout;
var fix = require('./fix');

eachEntry(function(user, blog, entry, _next){

  var next = function(){
    log(' ✔ All entries checked');
    _next();
  };

  log(' ',entry.id + '.', entry.path);

  if (type(entry, 'number')) {
    return fakeEntry(blog.id, entry, next);
  }

  fix(blog, entry, function(entry, changes){

    ensure(entry, Entry.model, true);

    Entry.set(blog.id, entry.id, entry, function(err){

      if (err) throw err;

      Entry.get(blog.id, entry.id, function(savedEntry){

        // The entry changed, lets work out
        // why before continuing
        if (!_.isEqual(savedEntry, entry)) {
          return debug(entry, savedEntry, changes, next);
        }

        assert.deepEqual(savedEntry, entry);
        next();
      });
    });
  });
}, process.exit, options);