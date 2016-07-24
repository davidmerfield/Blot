var redis = require('redis').createClient();
var helper = require('../../app/helper');
var ensure = helper.ensure;
var Entry = require('../../app/models/entry');

module.exports = function(blogID, entryID, callback) {

  ensure(blogID, 'string')
    .and(entryID, 'number')
    .and(callback, 'function');

  var entry = fakeEntry(entryID);

  ensure(entry, Entry.model, true);

  var pathKey = Entry.key.path(blogID, entry.path);
  var entryKey = Entry.key.entry(blogID, entryID);

  redis.set(pathKey, entryID, function(err, stat){

    if (err) throw err;

    if (stat) console.log('SET:', pathKey, entryID);

    redis.set(entryKey, JSON.stringify(entry), function(err){

      if (err) throw err;

      if (stat) console.log('SET:', entryKey, entryID);

      console.log(entry);

      Entry.save(blogID, entry, callback);
    });
  });
};

function sensibleDefaults (entry) {

  var defaults = {
    permalink: '',
    title: '',
    titleTag: '',
    body: '',
    summary: '',
    teaser: '',
    teaserBody: '',
    more: false,
    page: false,
    dateStamp: 1,
    render: false,
    metadata: {},
    retrieve: {},
    partials: [],
    path: '/' + entry.name,
    url: entry.id + '/' + entry.slug,
    html: '',
    slug: '',
    menu: false,
    scheduled: false,
    tags: [],
    size: 1,
    draft: false,
    updated: entry.created,
    date: helper.prettyDate(entry.created)
  };

  for (var i in defaults)
    if (entry[i] === undefined)
      entry[i] = defaults[i];

  return entry;
}

function fakeEntry (entryID) {
  return sensibleDefaults({
    id: entryID,
    name: entryID + '.txt',
    deleted: true,
    date: 'January 1st 1970',
    created: 1,
    updated: 1
  });
}