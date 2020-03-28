var extractMetadata = require("../../metadata");

module.exports = function(text) {
  var parsed = extractMetadata(text);

  var metadata = "<!--";

  for (var i in parsed.metadata)
    metadata += "\n" + i + ": " + parsed.metadata[i];

  if (metadata !== "<!--") {
    metadata += "\n-->\n";
    text = metadata + parsed.html;
  }

  return text;
};
