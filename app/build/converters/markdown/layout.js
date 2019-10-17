var tags = buildTags("{}", {
  "<>": "wide",
  "<<": "wide left",
  ">>": "wide right",
  "<": "left inside",
  ">": "right inside",
  ">|": "left margin",
  "|<": "right margin",
  "||": "two column",
  "|||": "three column",
  "||||": "four column"
});

var start = function(tag) {
  return '<div class="' + tags[tag] + '">\n';
};

var END = "\n</div>";

// Should we really add the clear?
// Is it strictly neccessary?

// What if we want to float something left inside?
var CLEAR = '\n<div class="clear"></div>';
var FOUR_SPACES = "    ";

function hasIndent(line) {
  return line.indexOf("\t") === 0 || line.indexOf(FOUR_SPACES) === 0;
}

// if there is additional indentation, try to add fencing so pre is preserved?

function trimLeading(str) {
  return str.slice(str.indexOf(str.trim()));
}

function layout(text) {
  // console.log('>>>>>>>>>');
  // console.log(text);
  // console.log('>>>>>>>>>');
  // {<>} Foo
  //      Bar

  // {||} A column

  var lines = text.split("\n");
  var totalLines = lines.length;

  for (var i = 0; i < totalLines; i++) {
    var line = lines[i];
    var tag = hasTag(line);

    if (!tag) continue;

    // If the next line is indented by a tab, or four or five
    // spaces then merge it into this tag
    for (var y = i + 1; y < totalLines; y++) {
      var nextLine = lines[y];

      if (!hasIndent(nextLine)) break;

      line += "\n" + trimLeading(nextLine);
      lines.splice(y, 1);
      y--;
      totalLines--;
    }

    line = trimLeading(line.slice(tag.length));
    line = start(tag) + line + END;
    lines[i] = line;

    if (isColumn(tag)) {
      // CLEAR if the next non-blank line is NOT a column
      for (var x = i + 1; x < totalLines; x++) {
        if (lines[x].trim() === "") continue;

        if (isColumn(hasTag(lines[x]))) break;

        lines[i] += CLEAR;
        break;
      }
    }
  }

  text = lines.join("\n");

  return text;
}

function escape(str) {
  return str
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;");
}

function hasTag(line) {
  var tag = null;

  for (var x in tags) if (line.indexOf(x) === 0) tag = x;

  return tag;
}

function isColumn(tag) {
  return tags[tag] && tags[tag].indexOf("column") > -1;
}

function buildTags(wrapper, tags) {
  var start = wrapper[0];
  var end = wrapper[1];

  for (var i in tags) {
    var tag = start + i + end;

    tags[tag] = tags[escape(tag)] = tags[i];

    delete tags[i];
  }

  return tags;
}

var assert = require("assert");

function testLayout(input, expected) {
  var output = layout(input);

  try {
    assert(output === expected);
  } catch (e) {
    console.log();
    console.log("INPUT:");
    console.log("-------------------------");
    console.log(input);

    console.log();
    console.log("OUTPUT:");
    console.log("-------------------------");
    console.log(output);

    console.log();
    console.log("EXPECTED:");
    console.log("-------------------------");
    console.log(expected);
  }
}

function m() {
  var args = Array.prototype.slice.call(arguments);

  return args.join("\n");
}

var ai = m(
  "{||} Hey",
  "A line",
  "{||||} This",
  "{||||} This is dope",
  "Another line"
);

var ao = m(
  '<div class="two column">',
  "Hey",
  "</div>",
  '<div class="clear"></div>',
  "A line",
  '<div class="four column">',
  "This",
  "</div>",
  '<div class="four column">',
  "This is dope",
  "</div>",
  '<div class="clear"></div>',
  "Another line"
);

testLayout(ai, ao);

var bi = m("{<|} Hey", "A line", "{>|} This");

var bo = m("{<|} Hey", "A line", '<div class="left margin">', "This", "</div>");

testLayout(bi, bo);

var ci = m(
  "A line we should ignore!",
  "{>|} First line",
  "     Another line.",
  "     And Another!",
  "Another line we should ignore",
  "{<>} Wide shit here!",
  "     more wide shit!",
  "         Indented wide shit that will not be preserved :(",
  "A final line to ignore."
);

var co = m(
  "A line we should ignore!",
  '<div class="left margin">',
  "First line",
  "Another line.",
  "And Another!",
  "</div>",
  "Another line we should ignore",
  '<div class="wide">',
  "Wide shit here!",
  "more wide shit!",
  "Indented wide shit that will not be preserved :(",
  "</div>",
  "A final line to ignore."
);

testLayout(ci, co);

module.exports = layout;
