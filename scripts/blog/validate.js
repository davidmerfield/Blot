var Sync = require('../../app/sync');
var VerifyFolder = require('../../app/sync/dropbox/verify');
var VerifyBlog = require('../../app/verify');

var eachBlog = require('../each/blog');
var get = require('./get');

var helper = require('../../app/helper');
var ensure = helper.ensure;

if (require.main === 'module') {

  var options = require('minimist')(process.argv.slice(2));

  var handle = process.argv[2];

  if (!handle)
    throw 'Please pass the blog\'s handle or ID as an argument.';

  if (handle === 'all') {

    console.log('Validating every blog!!');
    console.log();
    console.log();

    eachBlog(function(user, blog, nextBlog){

      validate(blog, nextBlog);

    }, process.exit, options);

  } else {

    console.log('Validating one blog!!');
    console.log();
    console.log();

    get(handle, function(user, blog){

      validate(blog, process.exit);
    });
  }

}


function validate (blog, callback) {

  ensure(blog, 'object')
    .and(blog.owner, 'string')
    .and(blog.id, 'string')
    .and(callback, 'function');

  Sync(blog.owner, function(err){

    // They might have removed their
    // app folder...
    if (err) {
      console.log(err);
      return callback();
    }

    VerifyFolder(blog.id, function(err){

      // They might have removed their
      // app folder...
      if (err) {
        console.log(err);
        return callback();
      }

      VerifyBlog(blog.id, function(err){

        if (err) console.log(err);

        callback();
      });
    });
  });
}

module.exports = validate;