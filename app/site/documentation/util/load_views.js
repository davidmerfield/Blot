var fs = require('fs-extra');
var cheerio = require('cheerio');

// These are all the pages that fall under
// the section 'How to use Blot'
// [
//  ['dates', 'Dates'],
//  ['formatting', 'Formatting blog posts'],
//  ['images', 'Adding images to blog posts'],
//  ['metadata', 'Metadata'],
//  ['static-server', 'Static server'],
//  ['tags', 'Tags'],
//  ['teasers', 'Teasers']
// ]

module.exports = function load_views (dir, prefix) {

  return fs.readdirSync(dir).filter(function(name){

    return name.indexOf(prefix) === 0;

  }).map(function(name){

    var slug = name.slice(prefix.length, name.lastIndexOf('.'));
    var content = fs.readFileSync(dir + '/' + name);
    var $ = cheerio.load(content);
    var title = $('h1').first().text();

    return {title: title, slug: slug};
  });
};