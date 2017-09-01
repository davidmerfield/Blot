var helper = require('helper');
var forEach = helper.forEach.parallel;
var config = require('config');
var secret = config.dropbox.secret;
var crypto = require('crypto');
var SIGNATURE = 'x-dropbox-signature';
var sha = crypto.createHmac.bind(this, 'SHA256');
var Database = require('database');
var sync = require('./sync');

var Router = require('express').Router();
var Webhook = Router.route('/');

// This is called by Dropbox to verify
// the webhook is valid.
Webhook.get(function(req, res, next) {

  if (req.query && req.query.challenge)
    return res.send(req.query.challenge);

  return next();
});

// This is called by Dropbox when changes
// are made to the folder of a Blot user.
Webhook.post(function(req, res) {

  if (config.maintenance) return res.sendStatus(503);

  var data = '';
  var accounts = [];
  var signature = req.headers[SIGNATURE];
  var verification = sha(secret);

  req.setEncoding('utf8');

  req.on('data', function(chunk){
    data += chunk;
    verification.update(chunk);
  });

  req.on('end', function() {

    if (signature !== verification.digest('hex'))
      return res.sendStatus(403);

    try {
      accounts = JSON.parse(data).list_folder.accounts;
    } catch (e) {
      return res.sendStatus(504);
    }

    // Tell Dropbox we retrieved the list of accounts
    res.sendStatus(200);

    // Sync each of the accounts!
    forEach(accounts, function(account_id, next_account){

      Database.get_blogs_by_account_id(account_id, function(err, blogs){

        forEach(blogs, function(blog, next_blog){

          sync(blog.id, function(){});

          next_blog();

        }, function(){});
      });

      next_account();

    // Do nothing when all the accounts have synced.
    }, function(){});
  });
});

module.exports = Router;