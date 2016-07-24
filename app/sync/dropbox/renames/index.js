var helper = require('../../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach;
var _ = require('lodash');
var stat = require('./stat');

var DEBUG = false;

module.exports = function (blogID, client, changes, callback) {

  ensure(blogID, 'string')
    .and(client, 'object')
    .and(changes, 'array')
    .and(callback, 'function');

  stat(blogID, client, changes, function(err, changes){

    if (DEBUG) {
      console.log();
      console.log();
      console.log(changes);
      console.log('--------------------');
    }

    var created = _.filter(changes, function(c){
      return !c.wasRemoved &&
              c.stat &&
             !c.stat.is_dir;
    });

    var removed = _.filter(changes, function(c){
      return  c.wasRemoved &&
              c.stat &&
             !c.stat.is_dir;
    });

    if (!created.length || !removed.length)
      return callback(null, changes);

    // is it right to
    forEach(removed, function(removedFile, nextRemoved){

      if (DEBUG) {
        console.log();
        console.log('---- ', removedFile.path);
      }

      var scores = [];

      forEach(created, function(createdFile, nextCreated){

        scores.push([guess(createdFile, removedFile), createdFile]);

        nextCreated();

      }, function(){

        // There are no created files left to compare
        if (!scores.length) return nextRemoved();

        scores.sort(function(a, b){
          return b[0] - a[0];
        });

        if (DEBUG) {
          scoreLog(scores);
        }

        var topPair = scores.shift();

        // The scores are a list of tuples
        // first item being score, second being file.
        var topScore = topPair[0];

        // None of the candidates look like a rename...
        if (topScore === 0) return nextRemoved();

        // We found a rename!
        var createdFile = topPair[1];

        createdFile.wasRenamed = true;
        createdFile.isSimilar = similar(createdFile, removedFile);

        createdFile.oldPath = removedFile.path;

        // Remove the old path from the list of changes and candidates...
        changes = _.filter(changes, function(file){return file.path !== removedFile.path;});
        created = _.filter(created, function(file){return file.path !== createdFile.path;});

        nextRemoved();
      });

    }, function(){

      callback(null, changes);
    });
  });
};


// Determine whether the two files
// have changed inbetween being renamed
function similar (created, removed) {

  var ccm, rcm, cs, rs;

  try {

    ccm = new Date(created.stat.client_mtime).getTime();
    rcm = new Date(removed.stat.client_mtime).getTime();

    cs = created.stat.size;
    rs = removed.stat.size;

  } catch (e) {

    return false;

  }

  return !!ccm && !!rcm && !!cs && !!rs && ccm === rcm && cs === rs;
}

// this calculates a score
// based on how likely the created
// file was renamed from the removed files.



function guess (created, removed) {

  var score = 0;

  if (!created.stat) return score;
  if (!removed.stat) return score;

  if (DEBUG) {
    console.log('  ++ ', created.stat.name);

    log('name', created.stat.name, removed.stat.name);
    log('size', created.stat.size, removed.stat.size);
    log('parent', createdParent, removedParent);
    log('mTime', createdMTime, removedMTime);
    log('mimeType', created.stat.mimeType, removed.stat.mimeType);
  }

  if (created.stat.name === removed.stat.name)
    score += 30;

  if (created.stat.size === removed.stat.size)
    score += 20;

  var createdParent = created.path.slice(0, -created.stat.name.length);
  var removedParent = removed.path.slice(0, -removed.stat.name.length);

  if (createdParent === removedParent)
    score += 10;

  var removedMTime = new Date(removed.stat.client_mtime).getTime();
  var createdMTime = new Date(created.stat.client_mtime).getTime();

  if (removedMTime === createdMTime)
    score += 10;

  // We only care about mimeType if something else matches
  if (score > 0 && created.stat.mime_type === removed.stat.mime_type)
    score += 10;

  return score;
}


function space(len) {
  var str = '';
  while (str.length < len) str += ' ';
  return str;
}

function log (property, created, removed) {
  var isTrue = created === removed ? '✔' : 'x';
  console.log(space(3), isTrue, property + ':', '+', created);
  console.log(space(6), space(property.length),'-', removed);
}

function scoreLog(scores) {
  console.log('  ==================');
  for (var i in scores) {
    var item = scores[i];
    console.log('  ++ ', item[0], item[1].path);
  }
}