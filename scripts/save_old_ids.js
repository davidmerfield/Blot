var forEach = require('helper').forEach;
var fs = require('fs');
var dump = __dirname + '/dump.ssv';
var ids = fs.readFileSync(dump, 'utf-8').split('\n');
var Entry = require('../app/models/entry');

function validate (id) {

  if (parseInt(id) + '' !== id)
    throw id + ' is invalid';

  var only_digits = /^\d+$/.test(id);

  if (!only_digits)
    throw id + ' contains non numeric characters';

  return true;
}

forEach(ids, function (line, next) {

  if (!line.trim()) return next();

  var blogID = line.split(' ')[0].trim();
  var entryID = line.split(' ')[1].trim();
  var path = line.split(' ').slice(2).join(' ').trim();

  validate(blogID);
  validate(entryID);

  console.log(blogID, entryID, path);

  Entry.set(blogID, path, {guid: entryID}, function(err){

    if (err) {
      console.log();
      console.log(err);
      console.log();
      return next();
    }

    next();
  });
}, process.exit);
