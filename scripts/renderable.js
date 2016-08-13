var eachEntry = require('./each/entry');
var options = require('minimist')(process.argv.slice(2));

var has_renderable = {};

var skip = [];

var ignore_these = ['{{ site.url }}', '{{more}}'];

function ignore (html) {

  if (html.indexOf('{{') === -1 || html.indexOf('}}') === -1) return true;

  if (html.indexOf('{{left}} Float left inside') > -1) return true;

  ignore_these.forEach(function(str){
    html = html.split(str).join('');
  });

  return html.indexOf('{{') === -1 && html.indexOf('}}') === -1
}


eachEntry(function(user, blog, entry, next) {

  if (user.isDisabled) return next();

  if (skip.indexOf(blog.handle) > -1) return next();

  if (ignore(entry.html)) return next();

  var i = entry.html.indexOf('{{');
  var focus = entry.html.slice(i - 100, i + 100);

  if (!focus.trim()) {
    i = entry.html.indexOf('}}');
    focus = entry.html.slice(i - 100, i + 100);
  }

  console.log();
  console.log(blog.handle, entry.path);
  console.log('-----------------------------------------------------------');
  console.log('...', focus, '...');
  console.log('-----------------------------------------------------------');

  has_renderable[blog.handle] = has_renderable[blog.handle] || [];
  has_renderable[blog.handle].push(entry.path);

  next();

}, function(){

  // console.log(has_renderable);

  process.exit();

}, options);