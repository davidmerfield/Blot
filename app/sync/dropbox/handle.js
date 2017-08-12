var helper = require('../../helper');
var forEach = helper.forEach;
var ensure = helper.ensure;
var Change = require('./change');
var filter = require('./filter');
var buildFromFolder = require('../../modules/template').update;

module.exports = function (blog, client, changes, callback) {

  ensure(blog, 'object')
    .and(changes, 'array')
    .and(callback, 'function');

  // For each changed file, filter them to determine
  // which blog the file belongs to, if any.
  filter(blog.folder, changes, function(err, changes){

    if (err) return callback(err);

    forEach(changes, function(change, nextChange){

      Change(blog, client, change, function (err) {

        if (err) console.log(err);

        nextChange();
      });
    }, function(){

      buildFromFolder(blog.id, callback);

    });
  });
};