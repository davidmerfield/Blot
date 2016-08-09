var dirname = require('path').dirname;
var resolve = require('helper').resolveSrc;

function render ($, callback, options) {

  var folder = dirname(options.path);

  // This matches css
  $('link[href]').each(function(){
    $(this).attr('href', resolve($(this).attr('href'), folder));
  });

  // This matches js, images video etc..
  $('[src]').each(function(){
    $(this).attr('src', resolve($(this).attr('src'), folder));
  });

  return callback();
}

module.exports = {
  render: render,
  first: true,
  optional: false
};