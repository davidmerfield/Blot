var slugify = require("./slugify");
var join = require("path").join;
var moment = require("moment");

module.exports = function(title, page, draft, dateStamp, slug) {
  var relative_path_without_extension;
  var name;

  slug = slugify(title || slug || dateStamp.toString() || "untitled");
  name = name || slug;

  name = name.split("/").join("-");

  if (page) {
    relative_path_without_extension = join("Pages", name);
  } else if (draft) {
    relative_path_without_extension = join("Drafts", name);
  } else {
    relative_path_without_extension = join(
      moment(dateStamp).format("YYYY"),
      moment(dateStamp).format("MM") +
        "-" +
        moment(dateStamp).format("DD") +
        "-" +
        name
    );
  }

  return relative_path_without_extension;
};
