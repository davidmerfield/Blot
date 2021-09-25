var normalize = require("models/tags").normalize;
var type = require("helper/type");

var moment = require("moment");
require("moment-timezone");

module.exports = function (req, res) {
  var blog = req.blog;

  // Can be either inherited from the properties of the blog
  // or from the template, or from the view
  var hideDate = res.locals.hide_dates || false;
  var dateDisplay = res.locals.date_display || "MMMM D, Y";

  return function (entry) {
    entry.formatDate = FormatDate(entry.dateStamp, req.blog.timeZone);
    entry.formatUpdated = FormatDate(entry.updated, req.blog.timeZone);
    entry.formatCreated = FormatDate(entry.created, req.blog.timeZone);

    entry.absoluteURL =
      req.blog.locals.blogURL +
      entry.url.split("/").map(encodeURIComponent).join("/");

    entry.backlinks = entry.backlinks.map(function (linkUrl) {
      return { label: linkUrl, url: linkUrl };
    });

    var tags = [];
    var tagged = {};
    var totalTags = entry.tags.length;

    for (var i = 0; i < totalTags; i++) {
      var tag = entry.tags[i];

      // augment has already been called on this
      // entry there is a bug in eachEntry
      if (!type(tag, "string")) {
        console.log(
          "Error BAD TAG:",
          req.blog.id,
          req.originalHost,
          req.url,
          "has format date?",
          type(entry.formatDate, "function")
        );
        console.log(tag);
        continue;
      }

      if (!tag) continue;

      var slug = normalize(tag);
      var lower = tag.toLowerCase();

      tagged[tag] = tagged[lower] = tagged[slug] = true;

      tags.push({
        name: tag,
        tag: tag,
        slug: slug,
        first: i === 0,
        last: i === totalTags - 1,
      });
    }

    for (var k in entry.thumbnail) {
      entry.thumbnail[k].ratio =
        (entry.thumbnail[k].height / entry.thumbnail[k].width) * 100 + "%";
    }

    entry.tags = tags;
    entry.tagged = tagged;

    // We don't want to compute the entry's date
    // string if the user explicitly told use to
    // hide the dates. We also want to hide the
    // dates for items in the menu, and items which
    // are pages. Otherwise its weird.
    if (!hideDate && !entry.menu && !entry.page) {
      entry.date = moment
        .utc(entry.dateStamp)
        .tz(blog.timeZone)
        .format(dateDisplay);
    } else {
      delete entry.date;
    }

    return entry;
  };
};

function FormatDate(dateStamp, zone) {
  return function () {
    return function (text, render) {
      try {
        text = text.trim();
        text = moment.utc(dateStamp).tz(zone).format(text);
      } catch (e) {
        text = "";
      }

      return render(text);
    };
  };
}
