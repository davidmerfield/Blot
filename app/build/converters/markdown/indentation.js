// Pandoc is very strict and treats indents inside
// HTML blocks as code blocks. This is correct but
// bad user experience. For instance this:
//
// <table>
//     <td>[Hey!](/goo)</td>
// </table>
//
// Becomes:
//
// <table>
// <pre><code><td>[Hey!](/goo)</td></code></pre>
// </table>
//
// This is obviously not desirable. But we want to
// mix HTML and Markdown in the same file. So I wrote
// a little script to collapse the indentation
// for the contents of an HTML tag. This preserves
// indentation in text! More discussion of this issue:
// https://github.com/jgm/pandoc/issues/1841

// This function will not remove the indents for pre
// formatted text <pre> since pandoc will leave those.
var cheerio = require('cheerio');
var $ = cheerio.load('');

function indentation (text) {

  // Ensure the text contains the ingredients
  // needed for a complete HTML tag! (<,>,/)
  if (!(/<|>|\//).test(text)) return text;

  var before = text;
  var lines = text.split('\n');
  var totalLines = lines.length;

  for (var i = 0; i < totalLines; i++) {

    var line = lines[i];
    var closingIndex = null;
    var name = firstTag(line);

    if (leadingWhitespace(line)) continue;

    if (hasPreTag(line)) {

      for (var l = i + 1; l < totalLines; l++) {
        if (hasPreTag(lines[l])) {
          i = l;
          break;
        }
      }

      continue;
    }

    if (!name) continue;

    for (var x = i; x < totalLines; x++) {
      if (hasClosingTag(lines[x], name)) {
        closingIndex = x;
        break;
      }
    }

    if (closingIndex === null) continue;

    for (var y = i; y <= closingIndex; y++)
      lines[y] = trimLeading(lines[y]);

    i = closingIndex; // -1 ? what if the next opens on this line...
  }

  text = lines.join('\n');

  if (verify(before, text)) {
    return text;
  } else {
    return before;
  }
}

// ensure the only thing that has changed
// is whitespace...
function verify (before, after) {

  before = before.replace(/\s/g, '');
  after = after.replace('/\s/g', '');

  if (after !== before) return before;

  return after;
}

function hasPreTag (line) {
  return line.indexOf('```') > -1;
}

function hasClosingTag (line, name) {
  return line.indexOf('</' + name + '>') > -1;
}

function firstTag (str) {
  str = str.trim();
  return str[0] === '<' && str.indexOf('>') > 0 && $(str)[0].name;
}

function leadingWhitespace (str) {
  return /^\s/.test(str);
}

function trimLeading(str){
  return str.slice(str.indexOf(str.trim()));
}

var assert = require('assert');

function testTrimLeading(str, expected){

  try {
    assert(trimLeading(str) === expected);
  } catch (e) {
    console.log('INPUT:', str);
    console.log('OUTPUT:', trimLeading(str));
    console.log('EXPECTED:', expected);
  }

}

testTrimLeading('f', 'f');
testTrimLeading('   f', 'f');
testTrimLeading('   f ', 'f ');

function testFirstTag (str, expected){

  try {
    assert(firstTag(str) === expected);
  } catch (e) {
    console.log('INPUT:', str);
    console.log('OUTPUT:', firstTag(str));
    console.log('EXPECTED:', expected);
  }

}

testFirstTag('< 3', false);
testFirstTag('1 < 3 > 10', false);
testFirstTag('<f>', 'f');
testFirstTag(' <foo><bar>', 'foo');
testFirstTag('<foo> bar', 'foo');

function testHasClosing (str, tag, expected){

  try {
    assert(hasClosingTag(str, tag) === expected);
  } catch (e) {
    console.log('INPUT:', str, tag);
    console.log('OUTPUT:', hasClosingTag(str, tag));
    console.log('EXPECTED:', expected);
  }

}

testHasClosing('< 3', 'f', false);
testHasClosing('a  </foo> hey </bar> this', 'foo', true);
testHasClosing('</foo></bar>', 'bar', true);

function testVerify (before, after, expected){

  try {

    if (expected) {
      assert(verify(before, after) === after);
    } else {
      assert(verify(before, after) === before);
    }

  } catch (e) {
    console.log('INPUT:', before, after);
    console.log('OUTPUT:', verify(before, after));
    console.log('EXPECTED:', expected);
  }

}

testVerify('3', '3', true);
testVerify('\n\r\t3   ', '3', true);



function testIndentation (input, expected) {

  try {

    assert(indentation(input) === expected);

  } catch (e) {
    console.log('INPUT:', input);
    console.log('OUTPUT:', indentation(input));
    console.log('EXPECTED:', expected);
  }
}

function m () {

  var args = Array.prototype.slice.call(arguments);

  return args.join('\n');
}

var aIn = m(
'<foo>',
'    <bar>',
'</foo>'
);

var aOut = m(
'<foo>',
'<bar>',
'</foo>'
);

testIndentation(aIn, aOut);

var bIn = m(
'<foo>',
'    <bar>',
'</foo><baz>',
'    <bat>',
'</baz>'
);

var bOut = m(
'<foo>',
'<bar>',
'</foo><baz>',
'<bat>',
'</baz>'
);

// testIndentation(bIn, bOut);

var cIn = m(
'```',
'<li>',
'  Chet',
'</li>',
'```'
);

testIndentation(cIn, cIn);

module.exports = indentation;