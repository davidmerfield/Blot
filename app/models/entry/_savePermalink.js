var helper = require('../../helper');
var ensure = helper.ensure;

var redis = require('../client');
var urlKey = require('./key').url;

var get = require('./get');

//'/style.css', '/script.js', '/feed.rss', '/robots.txt', '/sitemap.xml'
// are not possible because . is replaced with. ideally check for
// all template views here...
var banned = [
  '/archives',
  '/archive',
  '/search',
  '/tagged',
  '/public'
];

function err () {
  return new Error('Could not use permalink');
}

module.exports = function (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(entry.permalink, 'string')
    .and(entry.id, 'number')
    .and(callback, 'function');

  if (entry.scheduled || entry.draft || entry.deleted) {
    return callback(err());
  }

  var permalink = entry.permalink;

  if (!permalink) {
    return callback(err());
  }

  if (banned.indexOf(permalink.toLowerCase()) > -1) {
    return callback(err());
  }

  function overwrite() {
    redis.set(urlKey(blogID, permalink), entry.id, callback);
  }

  redis.get(urlKey(blogID, permalink), function(error, existingID){

    existingID = parseInt(existingID);

    // Permalink is free
    if (isNaN(existingID)) return overwrite();

    // Permalink is already set
    if (existingID === entry.id) return callback();

    // There is another entry with this permalink
    get(blogID, existingID, function(existingEntry){

      if (!existingEntry)
        throw 'No entry for ID ' + existingID;

      // Check if we can overwrite
      // a stale permalink
      if (existingEntry.permalink !== permalink) {
        // console.log('this permalink is now stale, overwrite!');
        overwrite();
      } else if (existingEntry.deleted) {
        // console.log('this permalink was used by a deleted entry...')
        overwrite();
      } else {
        // console.log('this permalink is still in use...');
        return callback(err());
      }
    });
  });
};