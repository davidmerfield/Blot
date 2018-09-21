var database = {};
var client = require("client");
var debug = require("debug")("client:git:database");

// I picked v4 from 5 possible versions
// because it said random next to its name?
var uuid = require("uuid/v4");

// JSON which stores useful information
// information about this particular blog & dropbox account
// combination, e.g. root directory and access token.
function tokenKey(blog_id) {
  return "blog:" + blog_id + ":git:token";
}

function refreshToken(blog_id, callback) {
  var new_token = uuid().replace(/-/g, "");

  debug("Blog:", blog_id, "Refreshing token");

  client.set(tokenKey(blog_id), new_token, function(err) {
    if (err) return callback(err);

    debug("Blog:", blog_id, "Set token successfully");

    return callback(null, new_token);
  });
}

function checkToken(blog_id, token, callback) {
  debug("Blog:", blog_id, "Checking token", token);

  getToken(blog_id, function(err, valid_token) {
    if (err) return callback(err);

    return callback(null, token === valid_token);
  });
}

function flush(blog_id, callback) {
  debug("Blog:", blog_id, "Getting token");

  client.del(tokenKey(blog_id), callback);
}

function getToken(blog_id, callback) {
  debug("Blog:", blog_id, "Getting token");

  client.get(tokenKey(blog_id), callback);
}

database.checkToken = checkToken;
database.getToken = getToken;
database.flush = flush;
database.refreshToken = refreshToken;

module.exports = database;
