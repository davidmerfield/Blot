var helper = require('helper');
var ensure = helper.ensure;
var blogDir = helper.blogDir;
var fs = require('fs');
var readFromFolder = require('./readFromFolder');
var async = require('async');

module.exports = function (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var templateDir = blogDir + '/' + blogID + '/templates';

  fs.readdir(templateDir, function(err, templates){

    if (err && err.code === 'ENOENT') return callback();

    if (err || !templates) return callback(err || 'No templates');

    async.eachSeries(templates, function(template, next){

      // Dotfile
      if (template.charAt(0) === '.') return next();

      var dir = templateDir + '/' + template;

      readFromFolder(blogID, dir, function(err){

        if (err) {
          // we need to expose this error
          // on the design page!
          console.log(err);
        }

        next();
      });
    }, function(){
      var cacheID = Date.now();
      require('blog').set(blogID, {
        cssURL: require('blog').url.css(cacheID),
        scriptURL: require('blog').url.js(cacheID),
        cacheID: cacheID
      }, callback);
    });
  });
};