var fs = require('fs');
var Mustache = require('mustache');
var render = Mustache.render;

var previewDir = __dirname + '/modules/preview';

// The script tag inserted into the head of
// every draft preview. This calls Blot's server to update shit
var injectionPath = previewDir + '/injection.html';
var draftContainer = previewDir + '/wrapper.html';

var helper = require('./helper');
var ensure = helper.ensure;
var basename = require('path').basename;

var routePrefix = '/draft';
var viewPrefix = '/view';
var streamPrefix = '/stream';

var joinpath = require('path').join;

var previewPrefix =  '[preview]';
var draftPrefix =  '[draft]';

var draftDir = '/drafts/';
var appendix = '.preview.html';

// /drafts/foo.txt
// /drafts/foo.preview.html

// /[draft] hello.html
// /[draft] hello.preview.html

// /hello [draft].txt
// /hello [draft].preview.html

var cheerio = require('cheerio');

var streamRoute = routePrefix + streamPrefix + '/*';
var viewRoute = routePrefix + viewPrefix + '/*';

var config = require('../config');
var Blog = require('./models/blog');

module.exports = (function () {

  function viewURL (handle, filePath) {
    return 'http://' + handle + '.' + config.host + viewRoute.slice(0, -2) + filePath;
  }

  function getPath (url, routeName) {

    // matches the wildcard param, no trailing slash
    var filePath = url.slice(routeName.length - 2);

    // Recode the path
    filePath = decodeURIComponent(filePath);

    return filePath;
  }

  function injectScript (html, filePath, callback) {

    var $ = cheerio.load(html , {decodeEntities: false});

    fs.readFile(injectionPath, 'utf-8', function (err, scriptTag){

      scriptTag = Mustache.render(scriptTag, {streamURL: streamRoute.slice(0, -1) + encodeURIComponent(filePath.slice(1))});

      $('head').append(scriptTag);

      return callback($.html(), $('body').html());
    });
  }

  function previewFile (blogID, path, callback) {

    ensure(blogID, 'string')
      .and(path, 'string')
      .and(callback, 'function');

    Blog.get({id: blogID}, function(err, blog){

      if (err || !blog)
        return callback(err || 'No blog with id ' + blogID);

      fs.readFile(draftContainer, 'utf-8', function(err, contents){

        if (err || !contents)
          return callback(err || 'No contents');

        var draftURL = viewURL(blog.handle, path);
        var remotePath = previewPath(joinpath(blog.folder, path));

        var view = {
          draftURL: draftURL,
          title: basename(path).split('[draft]').join('').trim()
        };

        try {
          contents = render(contents, view);
        } catch (e) {
          return callback(e);
        }

        return callback(err, remotePath, contents);
      });
    });
  }

  function previewPath (filePath) {

    ensure(filePath, 'string');

    if (filePath.toLowerCase().indexOf(draftDir) > -1)
      return filePath + appendix;

    filePath = filePath.split(draftPrefix).join(previewPrefix);
    filePath += '.html';

    return filePath;
  }

  function isDraft (filePath) {

    ensure(filePath, 'string');

    // If the file is in the drafts dir, then
    // return whether or not it is a preview.
    // This will return true for /drafts/foo.txt
    // and false for /drafts/foo.txt.preview.html
    if (filePath.toLowerCase().indexOf(draftDir) > -1) return !isPreview(filePath);

    // Otherwise see if it's an individual draft
    var fileName = basename(filePath);
    return fileName && fileName.slice(0, draftPrefix.length) === draftPrefix;
  }

  function isPreview (filePath) {

    // The filepath ends in .preview.html
    if (filePath.slice(-appendix.length) === appendix) return true;

    var fileName = basename(filePath);
    return fileName && fileName.slice(0, previewPrefix.length) === previewPrefix;
  }

  return {
    getPath: getPath,
    viewURL: viewURL,
    injectScript: injectScript,
    isDraft: isDraft,
    isPreview: isPreview,
    previewFile: previewFile,
    previewPath: previewPath,
    streamRoute: streamRoute,
    viewRoute: viewRoute
  };

}());