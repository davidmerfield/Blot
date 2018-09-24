var yaml = require('js-yaml');
var async = require('async');

module.exports = function (result, callback) {

  var frontmatter = result.source.split('---')[1];
  var missingHandlers = {};
  var metadata = {};
  
  try {
    // we can't pass in entire document, need to extract stuff between the ---s
    frontmatter = yaml.safeLoad(frontmatter);
  } catch (e) {
    return callback(e);
  }

  // Merges tags and categories
  if (frontmatter.categories) {
    frontmatter.tags = frontmatter.tags || [];
    frontmatter.tags = frontmatter.tags.concat(frontmatter.categories);
    delete frontmatter.categories;
  }

  async.eachOf(frontmatter, function(value, key, next){

    if (key === 'tags') {
      metadata.Tags = value.join(', ');
    } else if (key === 'permalink') {
      // We could remove trailing slash here...
      // if (value.slice(-1) === '/') value = value.slice(0, -1);
      metadata.Permalink = value;
    } else if (key === 'title') {
      result.title = value;
    } else if (key === 'layout') {
      
      if (value !== 'post') {
        console.warn('Warning: This file is not a post, it has layout property:Warning: ', value);
      }

    } else {
      missingHandlers[key] = missingHandlers[key] || [];
      missingHandlers[key].push(value);
    }

    next();

  }, function(err){

    result.metadata = metadata;
    result.missingHandlers = missingHandlers;
    callback(err, result);
  });
}