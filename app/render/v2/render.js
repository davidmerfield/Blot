var ERROR = require('./error');
var retrieve = require('../retrieve');

var helper = require('helper');
var cache = require('../../cache');
var extend = helper.extend;
var callOnce = helper.callOnce;
var mustache = require('./mustache');

// The http headers
var CONTENT_TYPE = 'Content-Type';
var CACHE_CONTROL = 'Cache-Control';


var UglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');
var minimize = new CleanCSS();

var cacheDuration = 'public, max-age=31536000';
var JS = 'application/javascript';
var STYLE = 'text/css';

var loadTemplate = require('./loadTemplate');

function render (req, res) {

  return function (name, _next, callback) {

    console.log('THIS RENDER!');

    var next = req.next;
    var blog = req.blog;
    var blogID = blog.id;
    var templateID = req.template.id;

    if (callback) callback = callOnce(callback);

    templateID = 'default';

    loadTemplate(blogID, templateID, name, function(err, response){

      if (err || !response)
        return next(ERROR.NO_VIEW());

      var viewLocals = response[0];
      var viewPartials = response[1];
      var missingLocals = response[2];
      var viewType = response[3];
      var view = response[4];

      extend(res.locals)
        .and(viewLocals)
        .and(req.template.locals)
        .and(blog.locals);

      extend(res.locals.partials)
        .and(viewPartials);

      retrieve(req, missingLocals, function(err, foundLocals){

        extend(res.locals)
          .and(foundLocals);

        var output;

        var locals = res.locals;
        var partials = res.locals.partials;

        if (req.query && req.query.json) {

          if (callback) return callback(null, res.locals);

          return res.json(res.locals);
        }

        try {
          output = mustache(view, locals, partials);
        } catch (e) {
          return next(ERROR.BAD_LOCALS());
        }


        if (callback) {
          return callback(null, output);
        }

        if (viewType === STYLE || viewType === JS) {
          res.header(CACHE_CONTROL, cacheDuration);
        }

        // I believe this minification
        // bullshit locks up the server while it's
        // doing it's thing. How can we do this in
        // advance? If it throws an error, the user
        // probably forgot an equals sign or some bs...
        try {

          if (viewType === STYLE && !req.previewSubdomain)
            output = minimize.minify(output || '');

          if (viewType === JS && !req.previewSubdomain)
            output = UglifyJS.minify(output, {fromString: true}).code;

        } catch (e) {}

        res.header(CONTENT_TYPE, viewType);
        res.send(output);

        cache.set(req, output, viewType);
      });
    });
  };
}

module.exports = render;