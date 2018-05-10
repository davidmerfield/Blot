var resolve = require('./resolve');
var cheerio = require('cheerio');
var is_url = require('./is_url');
var debug = require('debug')('build:dependencies');
var is_path = require('./is_path');
// The purpose of this module is to take the HTML for
// a given blog post and work out if it references any
// files in the user's folder. For example, this image
// does: <img src="apple.png"> but this video doesn't:
// <video><source src="//example.com/movie.mp4"></video>
// Our goal is to first resolve all relative file paths
// then determine the list of dependencies. This modifies
// the HTML passed to it.

function dependencies (path, html) {

  debug(path, html);

  // In future it would be nice NOT to reparse the HTML
  // Multiple times. The plugins features also do this.
  var $ = cheerio.load(html, {decodeEntities: false});  
  var dependencies = [];
  var attribute, value, resolved_value;

  // This matches CSS files in the blog post
  // This matches just about everything else,
  // including images, videos, scripts.
  $('link[href], [src]').each(function(){

    if (!!$(this).attr('href')) attribute = 'href';
    if (!!$(this).attr('src')) attribute = 'src';

    value = $(this).attr(attribute);

    if (is_url(value)) return;
  
    if (!is_path(value)) return;

    resolved_value = resolve(path, value);
    
    $(this).attr(attribute, resolved_value);
    if (dependencies.indexOf(resolved_value) === -1) dependencies.push(resolved_value);
  });


  return {html: $.html(), dependencies: dependencies};
}

module.exports = dependencies;

require('./unit_tests');