var config = require("config");
var Blog = require("blog");
var Entries = require("entries");
var Entry = require("entry");
var cheerio = require("cheerio");
var colors = require("colors/safe");

var THUMBNAIL_DIRECTORY = "/_thumbnails";
var AVATAR_DIRECTORY = "/_avatars";
var CACHED_IMAGE_DIRECTORY = "/_image_cache";

function main(blogID, callback) {
  switchAvatar(blogID, function(err) {
    if (err) return callback(err);
    Entries.each(
      blogID,
      function(entry, next) {
        var initial = JSON.stringify(entry);

        switchThumbnails(blogID, entry);

        entry.html = switchCachedImages(blogID, entry.html);
        entry.body = switchCachedImages(blogID, entry.body);
        entry.teaser = switchCachedImages(blogID, entry.teaser);
        entry.teaserBody = switchCachedImages(blogID, entry.teaserBody);
        entry.titleTag = switchCachedImages(blogID, entry.titleTag);

        // No changes to entry made
        if (JSON.stringify(entry) === initial) return next();

        Entry.set(blogID, entry.path, entry, next);
      },
      callback
    );
  });
}

function switchAvatar(blogID, callback) {
  Blog.get({ id: blogID }, function(err, blog) {
    if (err) return callback(err);

    if (blog.avatar.indexOf(AVATAR_DIRECTORY) !== 0) return callback();

    var avatar = config.cdn.origin + "/" + blog.id + blog.avatar;

    console.log(colors.dim("Blog: " + blogID + " -", blog.avatar));
    console.log(colors.dim("Blog: " + blogID) + " +", avatar);

    Blog.set(blogID, { avatar: avatar }, callback);
  });
}

function switchCachedImages(blogID, html) {
  if (html.indexOf(CACHED_IMAGE_DIRECTORY) === -1) return html;

  var $ = cheerio.load(html);
  var urls = [];

  $("[href]").each(function() {
    var url = $(this).attr("href");
    if (url.indexOf(CACHED_IMAGE_DIRECTORY) === 0) urls.push(url);
  });

  $("[src]").each(function() {
    var url = $(this).attr("src");
    if (url.indexOf(CACHED_IMAGE_DIRECTORY) === 0) urls.push(url);
  });

  urls.forEach(function(url) {
    var newUrl = config.cdn.origin + "/" + blogID + url;
    console.log(colors.dim("Blog: " + blogID + " -", url));
    console.log(colors.dim("Blog: " + blogID) + " +", newUrl);

    html = html.split(url).join(newUrl);
  });

  return html;
}

function switchThumbnails(blogID, entry) {
  for (var i in entry.thumbnail) {
    var thumbnail = entry.thumbnail[i];
    var newUrl = config.cdn.origin + "/" + blogID + thumbnail.url;

    if (thumbnail.url.indexOf(THUMBNAIL_DIRECTORY) !== 0) continue;

    console.log(colors.dim("Blog: " + blogID + " -", thumbnail.url));
    console.log(colors.dim("Blog: " + blogID) + " +", newUrl);

    thumbnail.url = newUrl;
  }
}

module.exports = main;

if (require.main === module) require("./cli")(main, {skipAsk:true});
