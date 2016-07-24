var Entry = require('../../app/models/entry');
var get = require('../blog/get');
var _ = require('lodash');
var helper = require('../../app/helper');
var type =helper.type;
var root = helper.rootDir;
var localPath = helper.localPath;

var blogIdentifier = process.argv[2] + '';

var entryIdentifier = process.argv[3] + '';

if (!blogIdentifier || !entryIdentifier)
  throw 'Please pass the blog identifier and entry identifier.';

get(blogIdentifier, function(user, blog){

  if (!user || !blog)
    throw 'No blog found with identifier ' + blogIdentifier;

  Entry.getByUrl(blog.id, entryIdentifier, function(entry){

    if (entry) return display(user, blog, entry);

    Entry.getByPath(blog.id, entryIdentifier, function(entry){

      if (entry) return display(user, blog, entry);

      if (!entry) throw 'No entry found with identifier ' + entryIdentifier;
    });
  });
});


function display (user, blog, entry){

  console.log('SRC', 'file://"' + localPath(blog.id, entry.path,'"'));
  console.log('URL', 'http://' + blog.handle + '.localhost:8080' + entry.url);

  delete entry.next;

  delete entry.previous;
    console.log(tidy(entry));
}

function tidy (obj) {

  obj = _.cloneDeep(obj);

  for (var i in obj)
    if (type(obj[i], 'string') && obj[i].length > 100)
      obj[i] = obj[i].slice(0,100) + '...';

  return obj;
}