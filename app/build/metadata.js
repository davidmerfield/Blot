var debug = require("debug")("blot:build:metadata");
var helper = require("helper");
var ensure = helper.ensure;

function Metadata(html) {
  ensure(html, "string");

  // We try and normalize all the different ways to end a line
  // here. This is how Windows does newlines, we normalize it
  // to the unix way.
  html = html.replace(/\r\n/gm, "\n");

  // Somehow some text-editors/OSs have a single return character
  // to signify a newline. Although it doesn't seem technically correct
  // we handle this edge cache here.
  html = html.replace(/\r/gm, "\n");

  var metadata = {};

  var linesToRemove = [];
  var lines = html.trim().split(/\n/);

  debug(lines.length, "lines found");

  // THIS SHOULD ALSO WORK FOR HTML:
  // i.e. <p>Page: yes</p>
  for (var i = 0; i < lines.length; i++) {
    var line, key, value, firstColon, firstCharacter;

    line = lines[i];

    // if we encounter an empty line, stop looking for metadata.
    if (!line || !line.trim()) {
      debug("Line", i, "found an empty line, breaking");
      break;
    }

    firstColon = line.indexOf(":");
    firstCharacter = line.trim().charAt(0);

    if (i === 0 && firstColon === -1 && line.trim() === "<!--") {
      debug("Line", i, "found an HTML comment open tag");
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
      debug("Line", i, "found a line without metadata, breaking");
      break;
    }

    // Do not continue if the first colon on the line is part of a URL
    // We want to allow URLS as part of the metadata value though
    if (
      (line.slice(firstColon - 4, firstColon) === "http" ||
        line.slice(firstColon - 5, firstColon) === "https") &&
      line.slice(firstColon + 1, firstColon + 3) === "//"
    ) {
      debug("Line", i, "found a line with a URL, breaking");
      break;
    }

    // The key is lowercased and trimmed
    key = line
      .slice(0, firstColon)
      .trim()
      .toLowerCase();
    value = line.slice(firstColon + 1).trim();

    debug("Line", i, "Found metadata from:", JSON.stringify(line));
    debug("Line", i, "Key", key, "value", value);

    // Extract metadata from within comments

    if (key.slice(0, 4) === "<!--") {
      key = key.slice(4).trim();
    }

    if (value.slice(-3) === "-->") {
      value = value.slice(0, -3).trim();
    }

    metadata[key] = value;
    debug("Line", i, "will be removed");
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
