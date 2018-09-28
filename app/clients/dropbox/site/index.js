var async = require('async');
var config = require('config');
var app_secret = config.dropbox.app.secret;
var full_secret = config.dropbox.full.secret;
var crypto = require('crypto');
var SIGNATURE = 'x-dropbox-signature';
var sha = crypto.createHmac.bind(this, 'SHA256');
var Database = require('../database');
var sync = require('./sync');

var Express = require('express');
var site = Express.Router();
var Webhook = site.route('/webhook');

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
  var secret = app_secret;

  if (!!req.query.full_access)
    secret = full_secret;

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
    // accounts can be synced in parallel
    async.each(accounts, function(account_id, next_account){

      Database.list_blogs(account_id, function(err, blogs){

        if (err) return next_account(err);
        
        // blogs can be synced in parallel
        async.each(blogs, sync, function(){});
      });

      next_account();

    // Do nothing when all the accounts have synced.
    }, function(){});
  });
});


module.exports = site;

