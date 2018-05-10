var client = require('client');
var dependentsKey = require('./key').dependents;
var _ = require('lodash');

module.exports = function (blogID, entry, previous, callback) {

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
    multi.SREM(dependentsKey(blogID, path), entry.path);
  });

  new_depdendencies.forEach(function(path){
    multi.SADD(dependentsKey(blogID, path), entry.path);
  });
  
  multi.exec(callback);
};