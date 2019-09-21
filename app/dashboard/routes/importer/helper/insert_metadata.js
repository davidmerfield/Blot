var moment = require("moment");

module.exports = function insert_metadata(post, callback) {
  var lines = [];
  var content = post.content;

  // Since we encode the post's date in the file's path, no need to do datestamp here?
  // if (post.dateStamp) lines.push('Date: ' + moment(post.dateStamp).format('MMMM Do, YYYY hh:mm'));

  if (post.tags && post.tags.length)
    lines.push("Tags: " + post.tags.join(", "));

  if (post.permalink) lines.push("Permalink: " + post.permalink);

  if (post.summary) lines.push("Summary: " + post.summary);

  if (post.metadata)
    for (var key in post.metadata)
      lines.push(capitalize(key) + ": " + post.metadata[key]);

  if (post.title) {
    lines.push(""); // leave a blank line between metadata and title
    lines.push("# " + post.title);
  }

  post.content = lines.join("\n") + "\n\n" + content;

  callback(null, post);
};

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}
