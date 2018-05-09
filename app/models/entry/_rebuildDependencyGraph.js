var client = require('client');
var dependentsKey = require('./key').dependents;
var _ = require('lodash');

module.exports = function (blogID, entry, previous, callback) {

  console.log('Blog:', blogID + ':', entry.path, ':: Saving dependencies for this post');
  console.log('Blog:', blogID + ':', entry.path, ':: Previous dependencies are:', previous);
  console.log('Blog:', blogID + ':', entry.path, ':: Current dependencies are:', entry.dependencies);

  var removed_dependencies = []; 
  var new_depdendencies = [];
  var multi = client.multi();

  // Since this post is no longer available, none of its current or former
  // dependencies are still dependencies. Remove everything.
  if (entry.deleted) {

    removed_dependencies = _.union(entry.dependencies, previous);

  // Since this post exists, we need to work out which dependencies were
  // added since the last time this post was saved. We also need to work
  // out which dependencies were removed. 
  } else {

    new_depdendencies = _.difference(entry.dependencies, previous);
    removed_dependencies = _.difference(previous, entry.dependencies);
  }

  removed_dependencies.forEach(function(path){
    console.log('Blog:', blogID + ':', entry.path, ':: This post ISNT dependent on', path);
    multi.SREM(dependentsKey(blogID, path), entry.path);
  });

  new_depdendencies.forEach(function(path){
    console.log('Blog:', blogID + ':', entry.path, ':: This post is NOW dependent on', path);
    multi.SADD(dependentsKey(blogID, path), entry.path);
  });
  
  multi.exec(callback);
};