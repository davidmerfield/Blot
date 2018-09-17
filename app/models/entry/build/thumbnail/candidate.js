var helper = require('helper');
var ensure = helper.ensure;
var cheerio = require('cheerio');

var config = require('config');
var MAX_PIXELS = config.MAX_PIXELS;
var MIN_HEIGHT = config.MIN_HEIGHT;
var MIN_WIDTH = config.MIN_WIDTH;

module.exports = function (html) {

  ensure(html, 'string');

  var src = '';

  try {

    var $ = cheerio.load(html, {decodeEntities: false});

    var candidate;
    var candidatePixels = 0;

    $('img').each(function(){

      var width = $(this).attr('width') || 1;
      var height = $(this).attr('height') || 1;
      var pixels = width * height;

      // We leave now if the user has specified a small
      // height. It's possible they're lying and we'll
      // check later too to make sure the image is large enough
      if (width > 1 && width < MIN_WIDTH) return;
      if (height > 1 && height < MIN_HEIGHT) return;

      if (pixels < MAX_PIXELS && pixels > candidatePixels) {
        candidate = this;
        candidatePixels = pixels;
      }
    });

    src = $(candidate).attr('src') || '';

  } catch (e){}

  return src;
};