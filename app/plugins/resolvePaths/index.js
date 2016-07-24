var dirname = require('path').dirname;
var resolve = require('path').resolve;
var Url = require('url');

function render ($, callback, options) {

  var parent = dirname(options.path);

  // We want to do this for css, js, images video etc..
  $('link[href], [src]').each(function(){

    try {

      var src = $(this).attr('src');
      var href = $(this).attr('href');
      var path = src || href;

      // this path is not already 'absolute'
      // and is not a URL
      if (!isURL(path) && path[0] !== '/') {
        path = resolve(parent, path);
      }

      if (path && src) $(this).attr('src', path);
      if (path && href) $(this).attr('href', path);

    } catch (e){}

  });

  return callback();
}

function isURL (src) {

  var url;

  // prepend protocol automatically
  if (src.indexOf('//') === 0)
    src = 'http:' + src;

  try {

    url = Url.parse(src);

    if (!url.host || !url.protocol) return false;

    url = url.href;

  } catch (e) {return false;}

  return url;
}

module.exports = {
  render: render,
  first: true,
  optional: false
};