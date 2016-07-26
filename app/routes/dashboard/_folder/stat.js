var stat = require('fs').stat;
var helper = require('../../../helper');
var localPath = helper.localPath;
var basename = require('path').basename;
var joinpath = require('path').join;
var moment = require('moment');
var Entry = require('../../../models/entry');
var IgnoredFiles = require('../../../models/ignoredFiles');
var extname = require('path').extname;

var REASONS = {
        'PREVIEW': 'a preview',
        'TOO_LARGE': 'too large',
        'WRONG_TYPE': 'not a file Blot can process'
      };
module.exports = function (blog, path, callback) {

  var blogID = blog.id;

  var local = localPath(blogID, path);

  stat(local, function(err, stat){

    if (err) return callback(err);

    IgnoredFiles.getStatus(blogID, path, function(err, ignored){

      Entry.getByPath(blogID, path, function(entry){

        if (ignored) ignored = REASONS[ignored] || 'was ignored';

        stat.path = path;
        stat.name = basename(path);

        stat.updated = moment.utc(stat.mtime).from(moment.utc(), true);

        stat.size = humanFileSize(stat.size);

        stat.directory = stat.isDirectory();
        stat.file = stat.isFile();
        stat.url = joinpath('/~', path);
        stat.entry = entry;
        stat.ignored = ignored;

        if (entry) {

          if (entry.page && entry.menu === false && ['.txt', '.md', '.html'].indexOf(extname(entry.path)) === -1) {
            entry.url = entry.path;
          }

          if (entry.draft) {
            entry.url = '/draft/view' + entry.path;
          }

          if (entry.scheduled) {
            entry.url += "?scheduled=true";
            entry.toNow = moment.utc(entry.dateStamp).fromNow();
            entry.date = moment.utc(entry.dateStamp)
                               .tz(blog.timeZone)
                               .format('MMMM Do YYYY, h:mma');
          }

        }

        return callback(null, stat);
      });
    });
  });

};

function humanFileSize(size) {

  if (size === 0) return '0 kb';

  var i = Math.floor( Math.log(size) / Math.log(1024) );

  return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['bytes', 'kB', 'MB', 'GB', 'TB'][i];
};