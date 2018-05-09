var dirname = require('path').dirname;
var resolve = require('./resolve');
var cheerio = require('cheerio');

function dependencies (contents, path) {
  
  var $ = cheerio.load(contents, {decodeEntities: false});

  // console.log('Entry:', path, ':: Begin input HTML ::::::::::::::::::::');
  // console.log($.html());
  // console.log('Entry:', path, ':: End input HTML ::::::::::::::::::::::');
  
  var dependencies = [];
  var folder = dirname(path);
  var attribute, resolved_attribute, not_resolved;

  // This matches css
  $('link[href]').each(try_resolve('href'));

  // Images
  $('[src]').each(try_resolve('src'));

  function try_resolve (attribute_name) {

    return function () {

      attribute = $(this).attr(attribute_name);
      resolved_attribute = resolve(attribute, folder);
      not_resolved = attribute === resolved_attribute;

      if (not_resolved) return;

      $(this).attr(attribute_name, resolved_attribute);
      dependencies.push(resolved_attribute);
    };
  }

  // console.log('Entry:', path, ':: Calculated dependencies are', dependencies);

  return {contents: $.html(), dependencies: dependencies};
}

module.exports = dependencies;