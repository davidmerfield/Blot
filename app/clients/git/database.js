var database = {};
var client = require("client");
var debug = require("debug")("client:git:dashboard");

// I picked v4 from 5 possible versions
// because it said random next to its name?
var uuid = require("uuid/v4");

// JSON which stores useful information
// information about this particular blog & dropbox account
// combination, e.g. root directory and access token.
function token_key(blog_id) {
  return "blog:" + blog_id + ":git:token";
}

function refresh_token(blog_id, callback) {
  var new_token = uuid().replace("-", "");

  debug("Blog:", blog_id, "Refreshing token");

  client.set(token_key(blog_id), new_token, function(err) {
    if (err) return callback(err);

    debug("Blog:", blog_id, "Set token successfully");

    return callback(null, new_token);
  });
}

function check_token(blog_id, token, callback) {
  debug("Blog:", blog_id, "Checking token", token);

  get_token(blog_id, function(err, valid_token) {
    if (err) return callback(err);

    return callback(null, token === valid_token);
  });
}

function get_token(blog_id, callback) {
  debug("Blog:", blog_id, "Getting token");

  client.get(token_key(blog_id), callback);
}

database.check_token = check_token;
database.get_token = get_token;
database.refresh_token = refresh_token;

module.exports = database;
