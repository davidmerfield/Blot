var database = {};
var client = require("models/client");
var debug = require("debug")("blot:clients:git:database");

// I picked v4 from 5 possible versions
// because it said random next to its name?
var uuid = require("uuid/v4");

function tokenKey(user_id) {
  return "user:" + user_id + ":git:token";
}

function generateToken() {
  return uuid().replace(/-/g, "");
}

function createToken(user_id, callback) {
  var new_token = generateToken();

  debug("User:", user_id, "Creating token if none exists");

  client.setnx(tokenKey(user_id), new_token, callback);
}

function refreshToken(user_id, callback) {
  var new_token = generateToken();

  debug("User:", user_id, "Refreshing token");

  client.set(tokenKey(user_id), new_token, function (err) {
    if (err) return callback(err);

    debug("User:", user_id, "Set token successfully");

    return callback(null, new_token);
  });
}

function checkToken(user_id, token, callback) {
  debug("User:", user_id, "Checking token", token);

  getToken(user_id, function (err, valid_token) {
    if (err) return callback(err);

    return callback(null, token === valid_token);
  });
}

function flush(user_id, callback) {
  debug("User:", user_id, "Getting token");

  client.del(tokenKey(user_id), callback);
}

function getToken(user_id, callback) {
  debug("User:", user_id, "Getting token");

  client.get(tokenKey(user_id), callback);
}

database.createToken = createToken;
database.checkToken = checkToken;
database.getToken = getToken;
database.flush = flush;
database.refreshToken = refreshToken;

module.exports = database;
