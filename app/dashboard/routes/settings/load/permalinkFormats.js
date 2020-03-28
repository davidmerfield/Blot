var permalink = require("../../../../build/prepare/permalink");
var moment = require("moment");
var FORMATS = [
  ["Title", "{{slug}}"],
  ["Date and title", "{{YYYY}}/{{MM}}/{{D}}/{{slug}}"],
  ["Custom", ""]
];

var SAMPLE = function() {
  return {
    slug: "title-of-post",
    id: 342,
    name: "file-name-of-post.txt",
    path: "/posts/file-name-of-post.txt",
    metadata: {}
  };
};

module.exports = function(req, res, next) {
  var sample, formats;

  req.debug("Permalink formats: creating sample post");

  sample = new SAMPLE();
  sample.dateStamp = moment.utc();

  formats = FORMATS.slice();

  req.debug("Permalink formats: creating list");

  formats = formats.map(function(arr) {
    var checked = "";
    var example;

    if (req.blog.permalink.isCustom && arr[0] === "Custom") {
      checked = "checked";
    } else if (
      !req.blog.permalink.isCustom &&
      arr[1] === req.blog.permalink.format
    ) {
      checked = "checked";
    }

    req.debug("Permalink formats: Rendering", arr[1]);
    example = permalink(req.blog.timeZone, arr[1], sample);
    req.debug("Permalink formats: Rendered", arr[1]);

    return {
      name: arr[0],
      value: arr[1],
      checked: checked,
      custom: arr[0] === "Custom" ? "custom" : "",
      example: example
    };
  });

  formats[formats.length - 1].last = true;
  res.locals.permalinkFormats = formats;

  req.debug("Permalink formats: finished generating list");
  next();
};
