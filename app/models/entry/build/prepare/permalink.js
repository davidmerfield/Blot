var mustache = require('mustache');
var DEFAULT = '{{slug}}';
var moment = require('moment');
             require('moment-timezone');

// this needs to be pulled directly from the moment library
// i copied them from the docs.
var MOMENT_TOKENS = ["M", "Mo", "MM", "MMM", "MMMM", "Q", "Qo", "D", "Do", "DD", "DDD", "DDDo", "DDDD", "d", "do", "dd", "ddd", "dddd", "e", "E", "w", "wo", "ww", "W", "Wo", "WW", "YY", "YYYY", "Y", "gg", "gggg", "GG", "GGGG", "A", "a", "H", "HH", "h", "hh", "k", "kk", "m", "mm", "s", "ss", "S", "SS", "SSS", "SSSS", "SSSSS", "SSSSSS", "SSSSSSS", "SSSSSSSS" , "SSSSSSSSS", "z", "zz", "Z", "ZZ", "X", "x"];
var helper = require('helper');
var normalize = helper.urlNormalizer;

var allow = ['slug', 'name', 'size', 'more', 'path', 'menu', 'page', 'dateStamp', 'created', 'updated', 'metadata'];

module.exports = function (timeZone, format, entry) {

  // Add the permalink automatically if the metadata
  // declared a page with no permalink set. We can't
  // do this earlier, since we don't know the slug then
  var permalink = '';
  var view = {};

  format = format || DEFAULT;

  try {

    // this is so inefficient
    MOMENT_TOKENS.forEach(function(token){
      view[token] = moment.utc(entry.dateStamp || entry.updated)
                     .tz(timeZone)
                     .format(token);
    });

    for (var i in entry)
      if (allow.indexOf(i) > -1)
        view[i] = entry[i];

    permalink = mustache.render(format || DEFAULT, view);

  } catch (e) {

    permalink = '';
  }

  return normalize(permalink);
};