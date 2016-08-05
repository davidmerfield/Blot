var eachEntry = require('./each/entry');
var options = require('minimist')(process.argv.slice(2));
var extname = require('path').extname;

var has_hidden = {};

var images = '.jpg .jpeg .gif .png'.split(' ');

eachEntry(function (user, blog, entry, next) {

  var hidden = false;

  entry.path.split('/').forEach(function(name){

    if (name && name[0] === '_' && images.indexOf(extname(entry.path)) === -1) {
      hidden = true;
    }

  });

  if (hidden) {

    has_hidden[blog.handle] = has_hidden[blog.handle] || [];
    has_hidden[blog.handle].push(entry.path);

  }

  next();

}, function(){

  console.log(has_hidden);

  process.exit();

}, options);