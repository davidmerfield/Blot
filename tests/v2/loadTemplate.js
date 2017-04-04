var helper = require('helper');
var themeDir = helper.themeDir;
var forEach = helper.forEach;
var fs = require('fs');
var parseTemplate = helper.parseTemplate;
var extend = helper.extend;
var dirname = require('path').dirname;
var mime = require('mime');

// var type = 'text/html';

// if (templateName === 'style' || templateName === 'style.css')
//   type = 'text/css';

// if (templateName === 'script' || templateName === 'script.js')
//   type = 'application/javascript';

// if (templateName === 'feed' || templateName === 'feed.rss')
//   type = 'application/rss+xml';

// if (templateName === 'robots' || templateName === 'robots.txt')
//   type = 'text/plain';

// if (templateName === 'sitemap' || templateName === 'sitemap.xml')
//   type = 'application/xml';

function read (themeID, name, callback) {

  var path = themeDir(themeID) + '/' + name;

  fs.readFile(path, 'utf-8', function(err, contents){

    if (!err && contents) {

      var mimeType = mime.lookup(path);

      return callback(null, contents, name, mimeType);
    }

    if (err && err.code !== 'ENOENT') return callback(err);

    fs.readdir(dirname(path), function(err, candidates){

      forEach(candidates, function(candidate, next){

        var possible_name = candidate.slice(0, candidate.lastIndexOf('.')) || candidate;

        if (possible_name === name && candidate !== name)
          return read(themeID, candidate, callback);

        next();

      }, function(){

        if (themeID === '*') return callback();

        read('*', name, callback);
      });
    });
  });
}

// Template: individual file (e.g. archives.html) which is passed to mustache
// Locals: variables used by Mustache to render a template
// Partials: sub templates used by Mustache, they are rendered
// View: the partials and locals needed to render a template
// Theme: the collection of templates, respresented as a folder which make up a design
// Retrieve: a dictionary of locals that we need to fetch from the db

function loadJSON (path, callback) {

  fs.readFile(path, 'utf-8', function(err, json){

    if (err) return callback(err);

    json = json || {};

    try {
      json = JSON.parse(json);
    } catch (e){
      return callback(new Error('Config.json is not valid JSON'));
    }

    callback(null, json);
  });
}

function loadConfig (themeID, callback) {

  loadJSON(themeDir(themeID) + '/theme.json', function(err, theme_config){

    if (err) return callback(err);

    loadJSON(themeDir('*') + '/theme.json', function(err, global_config){

      if (err) return callback(err);

      extend(theme_config)
        .and(global_config);

      return callback(null, theme_config);
    });
  });
}

function loadPartials (themeID, names, partials, retrieve, callback) {

  forEach(names, function(partialName, next){

    // We have already loaded this, don't do it again
    if (partials[partialName] !== undefined)
      return next();

    read(themeID, partialName, function(err, partial){

      if (err) partial = '';

      partials[partialName] = partial ;

      var parsedPartial = parseTemplate(partial);

      extend(retrieve).and(parsedPartial.retrieve);

      loadPartials(themeID, parsedPartial.partials, partials, retrieve, next);
    });
  }, function(){

    callback(null, partials, retrieve);
  });
}


function loadTemplate (blogID, themeID, templateName, callback) {

  loadConfig(themeID, function(err, config){

    if (err) return callback(err);

    // First we retrieve the template we will render

    read(themeID, templateName, function(err, template, templateName, mimeType){

      var locals = config.locals || {};
      var partials = config.partials || {};
      var retrieve = {};

      if (config[templateName]) {

        extend(partials)
          .and(config[templateName].partials || {});

        extend(locals)
          .and(config[templateName].locals || {});
      }

      // Now we parse the template to determine the
      // locals we need to retrieve from the db and
      // the partials we need to retrieve from disk.
      var parsedTemplate = parseTemplate(template);

      extend(retrieve).and(parsedTemplate.retrieve);

      var partialNames = parsedTemplate.partials;

      loadPartials(themeID, partialNames, partials, retrieve, function(err, partials, retrieve){

        callback(null, [locals, partials, retrieve, mimeType, template]);
      });
    });
  });
}

module.exports = loadTemplate;