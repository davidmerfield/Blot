var helper = require("helper");
var ensure = helper.ensure;

var alphaNumericRegEx = /^([a-zA-Z0-9 ]+)$/;

function Metadata(html) {
  ensure(html, "string");

  var metadata = {};

  var linesToRemove = [];
  var lines = html.trim().split(/\n/);

  // THIS SHOULD ALSO WORK FOR HTML:
  // i.e. <p>Page: yes</p>
  for (var i = 0; i < lines.length; i++) {
    var line, key, value, firstColon, firstCharacter;

    line = lines[i];

    // if we encounter an empty line, stop looking for metadata.
    if (!line || !line.trim()) break;

    firstColon = line.indexOf(":");
    firstCharacter = line.trim().charAt(0);

    if (i === 0 && firstColon === -1 && line.trim() === "<!--") {
      continue;
    }

    // DO NOT continue looking for metadata
    // for the following reasons
    if (
      // there is no colon on this line
      firstColon === -1 ||
      // this line is probably a markdown title
      firstCharacter === "#" ||
      // this line is probably an HTML tag
      (firstCharacter === "<" && line.slice(0, 4) !== "<!--")
    ) {
      break;
    }

    // Do not continue if the first colon on the line is part of a URL
    // We want to allow URLS as part of the metadata value though
    if (
      (line.slice(firstColon - 4, firstColon) === "http" ||
        line.slice(firstColon - 5, firstColon) === "https") &&
      line.slice(firstColon + 1, firstColon + 3) === "//"
    ) {
      break;
    }

    // The key is lowercased and trimmed
    key = line
      .slice(0, firstColon)
      .trim()
      .toLowerCase();

    // The key contains non-alphanumeric characters, so reject it
    if (alphaNumericRegEx.test(key) === false) break;

    // The key contains more than two spaces, so reject it
    if (key.split(" ").length > 2) break;

    value = line.slice(firstColon + 1).trim();

    // Extract metadata from within comments

    if (key.slice(0, 4) === "<!--") {
      key = key.slice(4).trim();
    }

    if (value.slice(-3) === "-->") {
      value = value.slice(0, -3).trim();
    }

    metadata[key] = value;
    linesToRemove.push(i);
  }

  var linesRemoved = linesToRemove.length;

  // Remove lines with valid metadata
  while (linesToRemove.length) {
    lines.splice(linesToRemove.pop(), 1);
  }

  if (linesRemoved && lines.length) {
    // contents of HTML comment were parsed, so remove the trailing...
    if (lines[0].trim() === "<!--" && lines[1].trim() === "-->") {
      lines = lines.slice(2);
    }

    // We have the check if the first line exists again
    // because of the previous clause (which reduces lines length)
    if (lines[0] && lines[0].trim() === "-->") {
      lines = lines.slice(1);
    }

    // We have the check if the first line exists again
    // because of the previous clause (which reduces lines length)
    if (lines[0] && lines[0].trim() === "<!--") {
      lines = lines.slice(1);
    }
  }

  html = lines.join("\n");

  return {
    html: html,
    metadata: metadata
  };
}

module.exports = Metadata;
