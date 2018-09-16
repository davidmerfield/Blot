var helper = require('helper');
var ensure = helper.ensure;

var redis = require('../client');

var model = require('./model');

var ALL = 'all';
var ENTRIES = 'entries';
var DRAFTS = 'drafts';
var SCHEDULED = 'scheduled';
var PAGES = 'pages';
var DELETED = 'deleted';
var CREATED = 'created';

var lists = ['all', 'created', 'entries', 'drafts', 'scheduled', 'pages', 'deleted'];

module.exports = function (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, model)
    .and(callback, 'function');

  var multi = redis.multi();

  function add (list, score) {

    // By default, are sorted by date stamp
    // which is the entry's publish date
    if (score === undefined)
      score = entry.dateStamp;

    var key = listKey(blogID, list);

    // Currently this is a normalized
    // version of the entry's path.
    var value = entry.id;

    ensure(list, 'string')
      .and(score, 'number')
      .and(value, 'string');

    // Blot uses redis' sorted sets to
    // create lists of entries.
    multi.zadd(key, score, value);
  }

  function drop (list) {

    var key = listKey(blogID, list);
    var value = entry.id;

    ensure(list, 'string')
      .and(value, 'string');

    multi.zrem(key, value);
  }

  // There is a list of every entry that Blot knows
  // about for this blog. This includes deleted entries etc...
  add(ALL, entry.created);

  // There is a list of every deleted entry, again sorted
  // by creation date for catching file renames.
  // Perhaps it should be entry.updated?
  // There is also a list of every entry sorted by creation
  // date for catching renames.
  if (entry.deleted) {
    add(DELETED, Date.now());
    drop(CREATED);
  } else {
    drop(DELETED);
    add(CREATED, entry.created);
  }

  // Only show entry on list of blog posts
  // if it is neither on the menu/page, scheduled
  // for future publication, deleted or a draft.
  var visible = !(entry.menu ||
                  entry.scheduled ||
                  entry.page ||
                  entry.deleted ||
                  entry.draft);

  if (visible) {
    add(ENTRIES);
  } else {
    drop(ENTRIES);
  }

  if (entry.page) {
    add(PAGES);
  } else {
    drop(PAGES);
  }

  if (entry.draft) {
    add(DRAFTS);
  } else {
    drop(DRAFTS);
  }

  if (entry.scheduled) {
    add(SCHEDULED);
  } else {
    drop(SCHEDULED);
  }

  multi.exec(function(err){

    if (err) return callback(err);

    if (entry.menu) {
      addToMenu(blogID, entry, callback);
    } else {
      dropFromMenu(blogID, entry, callback);
    }
  });
};

function addToMenu (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, 'object')
    .and(callback, 'function');

  var newLink = {
        label: entry.title,
        url: entry.url,
        metadata: entry.metadata,
        id: entry.id
      };

  require('blog').get({id: blogID}, function(err, blog){

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