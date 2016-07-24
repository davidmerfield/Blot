var helper = require('../../../helper');
var ensure = helper.ensure;

function Metadata (contents) {

  ensure(contents, 'string');

  var metadata = {};

  var linesToRemove = [];
  var lines = contents.trim().split(/\n/);

  // THIS SHOULD ALSO WORK FOR HTML:
  // i.e. <p>Page: yes</p>
  for (var i = 0;i < lines.length; i++) {

    var line, key, value, firstColon, firstCharacter;

    line = lines[i];

    if (!line) continue;

    firstColon = line.indexOf(':');
    firstCharacter = line.trim().charAt(0);

    if (i === 0 && firstColon === -1 && line.trim() === '<!--') {
      continue;
    }

    // DO NOT continue looking for metadata
    // for the following reasons
    if (
      // there is no colon on this line
      firstColon === -1 ||

      // this line is probably a markdown title
      firstCharacter === '#' ||

      // this line is probably an HTML tag
     (firstCharacter === '<' && line.slice(0,4) !== '<!--') ||

      // the colon in this line is not followed by a space
      line.charAt(firstColon + 1) !== ' ') {
      break;
    }

    // The key is lowercased and trimmed
    key = line.slice(0,firstColon).trim().toLowerCase();
    value = line.slice(firstColon + 1).trim();

    // Extract metadata from within comments

    if (key.slice(0,4) === '<!--') {
      key = key.slice(4).trim();
    }

    if (value.slice(-3) === '-->'){
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
    if (lines[0].trim() === '<!--' &&
        lines[1].trim() === '-->') {
      lines = lines.slice(2);
    }

    // We have the check if the first line exists again
    // because of the previous clause (which reduces lines length)
    if (lines[0] && lines[0].trim() === '-->') {
      lines = lines.slice(1);
    }

    // We have the check if the first line exists again
    // because of the previous clause (which reduces lines length)
    if (lines[0] && lines[0].trim() === '<!--') {
      lines = lines.slice(1);
    }
  }

  contents = lines.join('\n');

  return {
    contents: contents,
    metadata: metadata
  };
}

module.exports = Metadata;