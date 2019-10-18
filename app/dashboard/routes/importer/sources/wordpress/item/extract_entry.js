var url = require("url");
var moment = require("moment");
var join = require("path").join;
var helper = require("../../../helper");
var determine_path = helper.determine_path;
var tidy = require("./tidy");

module.exports = function(item, output_directory) {
  return function(callback) {
    var entry = {};

    entry.draft =
      item["wp:status"][0] === "draft" ||
      item["wp:status"][0] === "private" ||
      item["wp:status"][0] === "pending";

    entry.page = item["wp:post_type"][0] === "page";

    entry.permalink = url.parse(item.link[0]).path;

    entry.html = item["content:encoded"][0];

    entry.title = item.title[0].trim();

    entry.dateStamp = entry.created = entry.updated = moment(
      item.pubDate[0]
    ).valueOf();

    entry.path = join(
      output_directory,
      determine_path(entry.title, entry.page, entry.draft, entry.dateStamp)
    );

    if (item.category) {
      entry.tags = item.category.map(function(category) {
        return category._;
      });
    }

    callback(null, entry);
  };
};
