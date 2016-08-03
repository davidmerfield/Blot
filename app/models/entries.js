var redis = require('./client');
var helper = require('helper');
var forEach = helper.forEach;
var ensure = helper.ensure;
var Entry = require('./entry');

module.exports = (function() {


  function adjacentTo (blogID, entryID, callback) {

    ensure(blogID, 'string')
      .and(entryID, 'string')
      .and(callback, 'function');

    var Entry = require('./entry');

    // Get the index of the entry in the list of entries
    redis.zrank(listKey(blogID, 'entries'), entryID, function (error, rank) {

      if (error) throw error;

      // If the entry has no rank its not got siblings
      // make sure you don't just bang rank, 0 is falsy in JS!
      if (typeof rank !== 'number') return callback();

      var lowerBound = rank > 0 ? rank - 1 : 0;

      redis.zrange(listKey(blogID, 'entries'), lowerBound, rank + 1, function (error, entryIDs){

        if (error) throw error;

        Entry.get(blogID, entryIDs, function(entries){

          // {skinny: true},

          var next, previous;

          if (entries.length) {
            previous = entries[0].id != entryID ? entries[0] : undefined;
            next = entries[entries.length - 1].id != entryID ? entries[entries.length - 1] : undefined;
          }

          return callback(next, previous);
        });
      });
    });
  }

  function getAll (blogID, options, callback) {

    if (typeof options === 'function' && !callback) {
      callback = options;
      options = {};
    }

    ensure(blogID, 'string')
      .and(options, 'object')
      .and(callback, 'function');

    // By default retrieve skinnier
    // entry info when getting every entry
    if (options.skinny === undefined)
        options.skinny = true;

    // By defauly we don't fetch deleted entries
    if (options.deleted === true) {

      return getRange(blogID, 0, -1, options, function(entries){

        if (entries === undefined) entries = [];

        getDeleted(blogID, function(err, deletedEntries){

          if (deletedEntries === undefined) deletedEntries = [];

          var allEntries = deletedEntries.concat(entries);

          return callback(allEntries);
        });
      });
    }

    return getRange(blogID, 0, -1, options, callback);
  }

  function getDeleted (blogID, callback) {

    var Entry = require('./entry');

    // This key refers to the total entries
    redis.get(Entry.key.nextEntryID(blogID), function(err, totalEntries){

      var entryIDs = [];
      // var options = {skinny: true, only: ['size', 'path', 'id', 'draft', 'created', 'updated', 'deleted']};

      getRange(blogID, 0, -1, {}, function(validEntries){

        for (var i = 1; i <= totalEntries; i++)
          if (validEntries.indexOf(i) === -1)
            entryIDs.push(i);

        // options,

        Entry.get(blogID, entryIDs, function(entries){

          var drafts = _.filter(entries, function(entry){
            return entry.draft && !entry.deleted;
          });

          var deletedEntries = _.filter(entries, function(entry){
            return entry.deleted;
          });

          if (entries.length !== entryIDs.length) {
            console.log('Failed to fetch all requested entries :(');
            console.log(deletedEntries.length + ' deleted posts found from ' + totalEntries + ' total posts, ' +  validEntries.length  + ' live entries, ' + entryIDs.length + ' requested to be checked, ' + entries.length + ' fetched successfully, ' + drafts.length + ' are live drafts');
          }

          callback(null, deletedEntries);
        });
      });
    });
  }

  function get (blogID, options, callback) {

    ensure(blogID, 'string')
      .and(callback, 'function');

    if (!options.lists && options.list)
        options.lists = [options.list];

    ensure(options.lists, 'array');

    // Skinny is true by default
    options.skinny = options.skinny !== false;

    var totalToFetch = 0,
        response = {},
        lists = options.lists.slice();

    delete options.lists;

    for (var i in lists) {
      totalToFetch++;
      options.list = lists[i];
      getRange(blogID, 0, -1, options, onComplete(options.list));
    }

    function onComplete (listName) {

      return function (listOfEntries) {

        totalToFetch--;

        response[listName] = listOfEntries;

        if (!totalToFetch) {
          callback(null, response);
        }
      };
    }
  }

  function getListIDs (blogID, listName, options, callback){

    ensure(blogID, 'string')
      .and(listName, 'string')
      .and(options, 'object')
      .and(callback, 'function');

    var list = listKey(blogID, listName);

    var start = 0;
    var end = -1;

    if (options.first) {
      start = 0;
      end = options.first - 1;
    }

    redis.zrevrange(list, start, end, function(err, ids){

      if (err) throw err;

      return callback(null, ids);
    });
  }

  function getRange (blogID, start, end, options, callback) {

    ensure(blogID, 'string')
      .and(start, 'number')
      .and(end, 'number')
      .and(options, 'object')
      .and(callback, 'function');

    var Entry = require('./entry'),
        listName = options.list || 'entries',
        key = listKey(blogID, listName);

    redis.zrevrange(key, start, end, function(error, entryIDs){

      if (error) throw error;

      if (!options.full && !options.skinny)
        return callback(entryIDs);

      // options,
      Entry.get(blogID, entryIDs, function(entries){
        return callback(entries);
      });
    });
  }

  function getPage (blogID, pageNo, pageSize, callback) {

    ensure(blogID, 'string')
      .and(pageNo, 'number')
      .and(pageSize, 'number')
      .and(callback, 'function');

    pageNo--; // zero indexed

    var start = pageNo * pageSize,
        end = start + (pageSize - 1);

    getRange(blogID, start, end, {full: true}, function(entries){

      redis.zcard(listKey(blogID, 'entries'), function(error, totalEntries){

        if (error) throw error;

        var pagination = {};

        totalEntries = parseInt(totalEntries);

        pagination.total = Math.ceil(totalEntries / pageSize);

        // total entries is not 0 indexed, remove 1
        if (totalEntries - 1 > end)
          pagination.next = pageNo + 2;

        if (pageNo > 0)
          pagination.previous = pageNo;

        if (!pagination.next && !pagination.previous)
          pagination = false;

        return callback(entries, pagination);
      });
    });
  }


  function lastUpdate (blogID, callback) {

    getRange(blogID, 0, 1, {skinny: true}, function(entries){

      if (entries && entries.length)
        return callback(null, entries[0].dateStamp);

      return callback();
    });
  }

  function getRecent (blogID, callback) {

    getRange(blogID, 0, 30, {skinny: true}, function(entries){

      callback(entries);
    });
  }

  function listKey (blogID, list) {

    ensure(blogID, 'string').and(list, 'string');

    if (lists.indexOf(list) === -1)
      throw 'There is no valid list with prefix ' + list;

    return 'blog:' + blogID + ':' + list;
  }

  return {
    get: get,
    adjacentTo: adjacentTo,
    getPage: getPage,
    getListIDs: getListIDs,
    getAll: getAll,
    getDeleted: getDeleted,
    getRecent: getRecent,
    lastUpdate: lastUpdate
  };

}());
