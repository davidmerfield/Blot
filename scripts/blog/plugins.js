var eachBlog = require('../each/blog');
var Blog = require('../../app/models/blog');
var defaultPlugins = require('../../app/plugins').defaultList;
var helper = require('../../app/helper');
var extend = helper.extend;

if (require.main === module) {
  main(process.exit);
}

function main (callback) {

  eachBlog(function(user, blog, next){

    // console.log();
    // console.log(blog.handle + ' updating plugin list:');

    // rename('imageLink', 'autoImage');
    // rename('smartPunctuation', 'typeset');

    for (var i in defaultPlugins)
      if (blog.plugins[i] === undefined)
        console.log(blog.handle, 'Adding plugin ' + i);

    extend(blog.plugins).and(defaultPlugins);

    // If we've removed a plugin, remove it
    // from the blog's plugin list
    for (var y in blog.plugins)
      if (defaultPlugins[y] === undefined) {
        console.log(blog.handle, 'Dropping plugin ' + y + ' was enabled? ' + blog.plugins[y].enabled);
        delete blog.plugins[y];
      }

    for (var x in defaultPlugins)
      if (blog.plugins[x] === undefined)
        throw x + ' is not specified for this blog';

    Blog.set(blog.id, blog, function(){

      next();
    });

    function rename (from, to) {

      if (blog.plugins[from] !== undefined &&
          blog.plugins[to] === undefined) {
        blog.plugins[to] = blog.plugins[from];
        delete blog.plugins[from];
        console.log(blog.handle, 'renamed ' + from + ' to ' + to);
      }
    }

  }, callback);
}

module.exports = main;