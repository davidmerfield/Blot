var Blog = require('blog');
var helper = require('helper');
var forEach = helper.forEach.parallel;
var config = require('config');
var secret = config.dropbox.secret;
var crypto = require('crypto');
var SIGNATURE = 'x-dropbox-signature';
var sha = crypto.createHmac.bind(this, 'SHA256');
var sync = require('../sync');

module.exports = function (server) {

  var webhook = server.route('/webhook');

  webhook.get(function(req, res, next) {

    if (req.query && req.query.challenge)
      return res.send(req.query.challenge);

    return next();
  });

  webhook.post(function(req, res) {

    if (config.maintenance)
      return res.status(503).send('Under maintenance');

    console.log('hook Recieved!');

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
        return res.send(403);

      try {
        accounts = JSON.parse(data).list_folder.accounts;
      } catch (e) {
        return res.status(504).send('Bad delta');
      }

      // Tell dropbox it worked!
      res.send('OK');

      // Sync each of the UIDs!
      forEach(accounts, function(account_id, nextAccount){

        // cast account_id to string
        account_id = account_id + '';

        Blog.getByDropboxAccountId(account_id, function(err, blogs){

          forEach(blogs, function(blog, nextBlog){

            sync(blog.id);
            nextBlog();

          }, nextAccount);
        });
      }, function(){

      });
    });
  });
};