var permalink = require('../../../models/entry/build/prepare/permalink');
var moment = require('moment');

module.exports = function (req, res, next) {

  var sample = {
    dateStamp: moment.utc(),
    slug: 'title-of-post',
    id: 342,
    name: 'file-name-of-post.txt',
    path: '/posts/file-name-of-post.txt',
    metadata: {}
  };

  var formats = [
    ['Title', '{{slug}}'],
    ['Date and title', '{{YYYY}}/{{MM}}/{{D}}/{{slug}}'],
    ['Custom', '']
  ];

  formats = formats.map(function(arr){

    var checked = '';

    if (req.blog.permalink.isCustom && arr[0] === 'Custom') {
      checked = 'checked';
    } else if (!req.blog.permalink.isCustom && arr[1] === req.blog.permalink.format) {
      checked = 'checked';
    }

    return {
      name: arr[0],
      value: arr[1],
      checked: checked,
      custom: arr[0] === 'Custom' ? 'custom' : '',
      example: permalink(req.blog.timeZone, arr[1], sample)
    };
  });

  formats[formats.length - 1].last = true;
  res.locals.permalinkFormats = formats;

  next();
};