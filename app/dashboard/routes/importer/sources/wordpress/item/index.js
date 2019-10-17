var async = require("async");
var helper = require("../../../helper");
var extract_entry = require("./extract_entry");
var convert_to_markdown = require("./convert_to_markdown");
var tidy = require("./tidy");

module.exports = function(item, output_directory, callback) {
  // Filter out items which should not become posts or pages
  if (
    item["wp:post_type"][0] === "nav_menu_item" ||
    item["wp:post_type"][0] === "attachment" ||
    item["wp:post_type"][0] === "feedback"
  ) {
    return callback(null);
  }

  async.waterfall(
    [
      extract_entry(item, output_directory),
      tidy,
      helper.download_pdfs,
      helper.download_images,
      convert_to_markdown,
      helper.insert_metadata,
      helper.write
    ],
    function(err, result) {
      if (err) console.error(err);
      callback(null);
    }
  );
};
