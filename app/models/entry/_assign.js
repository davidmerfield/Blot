var Blog = require('../blog');
var helper = require('../../helper');
var ensure = helper.ensure;

var redis = require('../client');

var model = require('./model');

var ALL = 'all';
var ENTRIES = 'entries';
var DRAFTS = 'drafts';
var SCHEDULED = 'scheduled';
var PAGES = 'pages';
var DELETED = 'deleted';

var lists = ['all', 'entries', 'drafts', 'scheduled', 'pages', 'deleted'];

module.exports = function (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, model)
    .and(callback, 'function');

  var add = addToList.bind(this, blogID, entry);
  var drop = dropFromList.bind(this, blogID, entry);

  // Do nothing...
  function done () {}

  add(ALL, done);

  if (entry.deleted) {
    add(DELETED, done);
  } else {
    drop(DELETED, done);
  }

  // Register this entry as a draft,
  // otherwise ensure it's not on the list
  if (entry.draft) {
    add(DRAFTS, done);
  } else {
    drop(DRAFTS, done);
  }

  if (entry.page) {
    add(PAGES, done);
  } else {
    drop(PAGES, done);
  }

  // Register this entry as a scheduled post,
  // otherwise ensure it's not on the list
  if (entry.scheduled) {
    add(SCHEDULED, done);
  } else {
    drop(SCHEDULED, done);
  }

  // Otherwise add the entry to the list of
  // recent entries and ensure it's not on the menu
  if (entry.menu || entry.scheduled ||
      entry.page || entry.deleted ||
      entry.draft) {
    drop(ENTRIES, done);
  } else {
    add(ENTRIES, done);
  }

  // If the entry is flagged as on the menu
  // then remove it from the list of entries
  // and add it to the list of menu links
  if (entry.menu) {
    addToMenu(blogID, entry, then);
  } else {
    dropFromMenu(blogID, entry, then);
  }

  // This is only called by entry.menu
  // since we can't have multiple conccurent
  // changes to it...
  function then () {
    return callback();
  }
};


function addToList (blogID, entry, list, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(list, 'string');

  // Recent entries are arranged by timestamp
  // and have the entries ID stored against it
  var score = parseFloat(entry.dateStamp),
      value = entry.id;

  ensure(score, 'number')
    .and(value, 'string');

  redis.zadd(listKey(blogID, list), score, value, callback);
}

function dropFromList (blogID, entry, list, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(list, 'string');

  redis.zrem(listKey(blogID, list), entry.id, callback);
}

function addToMenu (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(callback, 'function');

  var newLink = {
        label: entry.title,
        url: entry.url,
        metadata: entry.metadata,
        id: entry.id.toString() // this might collide with a timestamp
      };

  Blog.get({id: blogID}, function(err, blog){

    var menu = blog.menu;

    if (!menu || !menu.length) {
      return Blog.set(blogID, {menu: [newLink]}, callback);
    }

    for (var i = 0;i < menu.length; i++) {

      if (menu[i].id == entry.id || menu[i].url === entry.url) {
        menu[i] = newLink;
        return Blog.set(blogID, {menu: menu}, callback);
      }
    }

    menu.push(newLink);
    return Blog.set(blogID, {menu: menu}, callback);
  });
}


// Removes the entry from the list of links in the header
function dropFromMenu (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(callback, 'function');

  Blog.get({id: blogID}, function(err, blog){

    var menu = blog.menu;

    if (!menu || !menu.length)
      return callback();

    var i = menu.length;

    while (i--) {
      if (menu[i].id == entry.id) {
        menu.splice(i, 1);
      }
    }

    Blog.set(blogID, {menu: menu}, function(errors){

      if (errors && errors.menu)
        return callback(errors.menu);

      return callback();
    });
  });
}


function listKey (blogID, list) {

  ensure(blogID, 'string').and(list, 'string');

  if (lists.indexOf(list) === -1)
    throw 'There is no valid list with prefix ' + list;

  return 'blog:' + blogID + ':' + list;
}
