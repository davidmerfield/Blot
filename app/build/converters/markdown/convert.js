var spawn = require("child_process").spawn;
var indentation = require("./indentation");
var footnotes = require("./footnotes");
var helper = require("helper");
var time = helper.time;
var config = require("config");
var pandoc_path = config.pandoc_path;
var debug = require("debug")("blot:converters:markdown");
var ampersands = require("./ampersands");

// insert a <br /> for each carriage return
// '+hard_line_breaks' +

module.exports = function(text, callback) {
  var extensions =
    // replace url strings with a tags
    "+autolink_bare_uris" +
    // This feature fucks with [@twitter]() links
    // perhaps make it an option in future?
    "-citations" +
    // Fucks up with using horizontal rules
    // without blank lines between them.
    "-simple_tables" +
    "-multiline_tables" +
    // We already convert any math with katex
    // perhaps we should use pandoc to do this
    // instead of a seperate function?
    "-tex_math_dollars" +
    // This sometimes throws errors for some reason
    "-yaml_metadata_block" +
    // Don't generate figures automatically
    "-implicit_figures" +
    // These require a blank line before shit
    "+lists_without_preceding_blankline" +
    "-blank_before_header" +
    "-blank_before_blockquote";

  var pandoc = spawn(pandoc_path, [
    "-f",
    "markdown" + extensions,

    // Not really sure what the difference is between
    // this and just HTML.
    "-t",
    "html5",

    // Don't declare widths for tables
    // https://github.com/jgm/pandoc/issues/2574
    "--columns",
    "1000",

    // we use our own highlighint library (hljs) later
    "--no-highlight",

    // such a dumb default feature... sorry john!
    "--email-obfuscation=none"
  ]);

  var result = "";
  var error = "";

  pandoc.stdout.on("data", function(data) {
    result += data;
  });

  pandoc.stderr.on("data", function(data) {
    error += data;
  });

  pandoc.on("close", function(code) {
    time.end("pandoc");

    var err = null;

    // This means something went wrong
    if (code !== 0) {
      err = "Pandoc exited with code " + code;
      err += error;
      err = new Error(err);
    }

    if (err) return callback(err);

    debug("Pre-footnotes", result);
    time("footnotes");
    result = safely(footnotes, result);
    time.end("footnotes");

    debug("Pre-de-double-escape amerpsands");
    time("de-double-escape-ampersands");
    result = safely(ampersands.deDoubleEscape, result);
    time.end("de-double-escape-ampersands");

    debug("Final:", result);
    callback(null, result);
  });

  // This is to 'fix' and issue that pandoc has with
  // unescaped ampersands in HTML tag attributes.
  // Previously it would treat <a href="/?foo=bar&baz=bat">a</a>
  // as a string, because of the amerpsands.
  // This is an issue that's open in Pandoc's repo
  // https://github.com/jgm/pandoc/issues/2410
  debug("Pre-ampersands-escape", text);
  time("escape-ampersands");
  text = safely(ampersands.escape, text);
  time.end("escape-ampersands");

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
  debug("Pre-indentation", text);
  time("indentation");
  text = safely(indentation, text);
  time.end("indentation");

  debug("Pre-pandoc", text);
  time("pandoc");
  pandoc.stdin.end(text, "utf8");
};

function safely(method, input) {
  try {
    input = method(input);
  } catch (e) {
    console.log("Conversion Error:", e.message || e.code, "caught safely");
    if (e.stack) console.log(e.stack);
  }

  return input;
}
