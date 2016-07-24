var config = require('../../../config');
var each = require('../eachEl');
var Url = require('url');

var Twit = require('twit');
var Twitter = new Twit(config.twitter);

var SCRIPT = '<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>';

function render ($, callback) {

  var prepend;

  each($, 'a', function(el, next){

    var href, host, text, id;

    try {

      href = $(el).attr('href');
      text = $(el).text();

      host = Url.parse(href).host;
      id = parseID(href);

    } catch (e) {
      return next();
    }

    // Ensure we managed to extract everything from the url
    if (!href || !text || !id || !host) return next();

    // Look for bare links
    if (href !== text) return next();

    // which point to twitter.com
    if (host !== 'twitter.com') return next();

    fetch(id, $(el), function(err, success){

      if (success) prepend = true;

      next();
    });

  }, function(){

    // Now we add the script tag if needed
    if (prepend) $.root().prepend(SCRIPT);

    callback();
  });
}

function parseID (url) {

  var path, paths, tweetID, category;

  path = Url.parse(url).pathname;

  // Trim trailing slash if applicable
  if (path.slice(-1) === '/')
    path = path.slice(0, -1);

  // map /USER/status/123 -> ['USER', 'status', '123']
  paths = path.split('/');

  tweetID = paths.pop();
  category = paths.pop().toLowerCase();

  // Not a twitter status
  if (category !== 'status') return '';

  return tweetID;
}

function fetch (id, $el, callback) {

  var params = {
    "id": id,
    "hide_thread": true
  };

  Twitter.get('statuses/oembed', params, function(err, data) {

    if (err || !data || !data.html)
      return callback();

    var html = data.html;

    if (html.indexOf(SCRIPT) > -1) {

      html = html.slice(0, -SCRIPT.length);

    } else {

      console.warn('Response from twitter no longer includes script tag');
    }

    $el.replaceWith(html);

    callback(null, true);
  });
}

module.exports = {
  render: render,
  category: 'Typography',
  title: 'Tweets',
  description: 'Replace a URL to a tweet with an embedded tweet.'
};