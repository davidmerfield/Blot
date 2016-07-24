var helper = require('../../helper');
var ensure = helper.ensure;
var joinpath = require('path').join;
var forEach = helper.forEach;
var Template = require('../../models/template');
var callOnce = helper.callOnce;

var makeClient = require('./makeClient');

function writeToFolder (blogID, templateID, callback) {

  ensure(blogID, 'string')
    .and(templateID, 'string')
    .and(callback, 'function');

  Template.isOwner(blogID, templateID, function(err, owner){

    if (err) return callback(err);

    if (!owner)
      return callback(badPermission(blogID, templateID));

    Template.getAllViews(templateID, function(err, views, metadata){

      if (err) return callback(err);

      if (!views || !metadata)
        return callback(noTemplate(blogID, templateID));

      makeClient(blogID, function(err, client, root){

        if (err) return callback(err);

        var dir = joinpath(root, 'Templates', metadata.slug);

        forEach(views, function(name, view, next){

          if (!view.name || !view.type || !view.content)
            return next();

          write(client, dir, view, next);

        }, callback);
      });
    });
  });
}

// Error codes from Dropbox's API
var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503     // rate limit error
];

var INIT_DELAY = 1000;
var MAX_ATTEMPTS = 10;

function shouldRetry (error) {
  return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
}

function write (client, dir, view, callback) {

  ensure(client, 'object')
    .and(dir, 'string')
    .and(view, 'object')
    .and(callback, 'function');

  callback = callOnce(callback);

  // eventually I should just store
  // the goddamn filename and avoid this
  // bullSHIT
  var extension = '.html';

  if (view.type === 'text/css') extension = '.css';
  if (view.type === 'application/xml') extension = '.rss';
  if (view.type === 'application/xml' && view.name === 'sitemap') extension = '.xml';
  if (view.type === 'application/javascript') extension = '.js';
  if (view.type === 'text/plain') extension = '.txt';

  var path = joinpath(dir, view.name + extension);
  var content = view.content;

  var delay = INIT_DELAY;
  var attempts = 1;

  client.writeFile(path, content, function done (error){

    // If error, determine whether or not to try again.
    if (shouldRetry(error) && attempts < MAX_ATTEMPTS) {

      attempts++;
      delay *= 2;

      setTimeout(function(){

        client.writeFile(path, content, done);

      }, delay);

    } else {

      callback();
    }
  });
}

function badPermission (blogID, templateID) {
  return new Error('No permission for ' + blogID + ' to write ' + templateID);
}

function noTemplate (blogID, templateID) {
  return new Error('No template for ' + blogID + ' and ' + templateID);
}

module.exports = writeToFolder;