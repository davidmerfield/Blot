var debug = require("debug")("blot:build:prepare:teaser");
// Some of these characters are different, though they look the same...
// Lines 5 - 24 should be removed, if I work out how to consolidate
// escaped chars?
// I should probably just escape the contents of each text node automatically?
// Then it's important that code and pre and other is ignored...
var invisible = ["h1", "h2", "h3", "h4", "h5", "h6", "script", "style"];
var cheerio = require("cheerio");

var breakPoints = [
  "<< more >>",
  "{{more}}",
  "<<more>>",
  "<!-- more -->",
  "<!- more ->",
  "<!— more —>"
];
var charMap = {
  "<": "&lt;",
  ">": "&gt;",
  "-": "&#x2014;"
};

for (var x in breakPoints) {
  var newBP = breakPoints[x];

  for (var y in charMap) {
    if (newBP.indexOf(y) > -1) {
      newBP = newBP.split(y).join(charMap[y]);
      if (newBP !== breakPoints[x]) breakPoints.push(newBP);
    }
  }
}

function removeNextSiblings(node, $) {
  if (!node) return;

  // Remove this node's siblings...
  var nextSibling = node.next;

  while (nextSibling) {
    $(nextSibling).remove();
    nextSibling = nextSibling.next;
  }

  // Back up...
  $(node)
    .nextAll()
    .remove();
}

function makeTeaser(html) {
  debug("loading HTML");

  var $ = cheerio.load(html, {
    decodeEntities: false
  });

  debug("loaded HTML");

  // Cache the html passed
  // so we can chech if
  // there is stuff after the teaser
  debug("caching HTML");
  var _html = $.html();
  debug("cached HTML");

  var root = $.root();

  // Flag to use so we can determine
  // whether to create a teaser automatically
  // as opposed to a breakpoint inserterd by the user
  var foundABreakPoint;

  debug("looking for breakpoints...");
  root.contents().each(function doLook(i, node) {
    // WE NEED TO IGNORE CERTAIN NODES NOW
    // E.G. CODE, PRE, STYLE
    if (
      $(this)
        .parents()
        .filter("code, head, pre, script, style").length
    ) {
      debug("should skip this tag");
      return;
    }

    // This node is itself the breakpoint
    // or contains a breakPoint in its text content
    if (isBreakPoint(node) || containsBreakPoint(node)) {
      debug("found a breakpoint!");

      // We care about the earliest breakpoint we find
      // and no more
      if (foundABreakPoint) return false;

      foundABreakPoint = true;

      // We cache the next node
      // and the parent node of the breakpoint
      // so we can use them after removing
      // the breakpoint node itself
      var next = node.next;
      var parent = node.parent;

      // We remove the breakpoint, calculate
      // the new HTML then proceed to strip the rest
      // of the HTML after the breakpoint
      if (containsBreakPoint(node)) {
        node.data = stripOtherText(node)[0];
      }

      if (isBreakPoint(node)) {
        $(node).remove();
      }

      // Now we remove the breakpoint node's next siblings
      removeNextSiblings(next, $);
      $(next).remove();

      // Finally we remove the next siblings of each of the
      // breakpoint node's parents. This ensures that all
      // content 'after' the breakpoint is stripped.
      while (parent) {
        removeNextSiblings(parent, $);
        parent = parent.parent;
      }

      // We didn't find a breakpoint yet so recurse down each child...
    } else if ($(this).contents() && $(this).contents().length) {
      debug("going deeper");
      $(this)
        .contents()
        .each(doLook);
    }
  });

  // Since we didn't find a manual breakpoint
  // we need to do things automatically
  if (!foundABreakPoint) {
    debug("did not find a breakpoint!");

    var MAXCHILDREN = 3;
    var index = 0;

    // Remove everything after the third node
    // remember i is zero indexed...
    root.contents().each(function() {
      if (index > MAXCHILDREN) return $(this).remove();

      if (invisible.indexOf(this.name) > -1) return;

      index++;
    });
  }

  var teaserHTML = $.html();

  if (teaserHTML.trim() === _html) {
    return false;
  }

  return teaserHTML;
}

function isBreakPoint(node) {
  var content;

  if (node.children && node.children[0] && node.children[0].data) {
    content = node.children[0].data.trim().toLowerCase();

    if (breakPoints.indexOf(content) > -1) return true;
  }

  if (node.data === undefined) return false;

  content = node.data.trim().toLowerCase();

  // Comment NODES
  // <!-- more --> and <!-- MORE --> etc...
  if (node.type === "comment" && content === "more") return true;

  // Text node soley contains breakpoint string
  // the breakpoint node needs to be this node's parent
  // (i.e. the node which contains this text)
  if (node.type === "text" && breakPoints.indexOf(content) > -1) return true;
}

function containsBreakPoint(node) {
  if (node.data === undefined || node.type !== "text") return false;

  var content = node.data.trim().toLowerCase();

  // Text node contains breakpoint string
  // as well as other text
  for (var i in breakPoints)
    if (content.indexOf(breakPoints[i]) > -1) return true;
}

function stripOtherText(node) {
  var content = node.data.trim().toLowerCase(),
    data = node.data,
    dataWithoutBreakPoint,
    dataStripped;

  for (var x in breakPoints) {
    if (content.indexOf(breakPoints[x]) > -1) {
      var i = content.indexOf(breakPoints[x]);

      dataStripped = data.slice(0, i);
      dataWithoutBreakPoint =
        data.slice(0, i) + data.slice(i + breakPoints[x].length);

      return [dataStripped, dataWithoutBreakPoint];
    }
  }
}

(function tests() {
  var assert = require("assert");

  function test(html, expected, expectedNewHTML, expectedMore) {
    var teaser = makeTeaser(html) || html;

    try {
      assert.deepEqual(teaser, expected);

      if (expectedMore) assert.deepEqual(expectedMore, teaser !== html);
    } catch (e) {
      console.log("ERROR ERROR ERROR ------------->");
      throw e;
    }
  }

  test(
    "<p>A</p><p>B</p><p>&lt;!- more -&gt;</p>",
    "<p>A</p><p>B</p>",
    "<p>A</p><p>B</p>",
    false
  );

  test(
    "<p>A</p><p>&lt;!&#x2014; more &#x2014;&gt;</p><p>C</p>",
    "<p>A</p>",
    "<p>A</p><p>C</p>",
    true
  );

  test(
    "<p>A<!-- more -->BCD<i>a</i></p><p>D</p>",
    "<p>A</p>",
    "<p>ABCD<i>a</i></p><p>D</p>",
    true
  );

  test(
    "<p>A</p><p>B</p><p>Goodbye &lt;!- more -&gt; Hello</p>",
    "<p>A</p><p>B</p><p>Goodbye </p>",
    "<p>A</p><p>B</p><p>Goodbye  Hello</p>",
    true
  );

  test(
    "<p>A</p><p>B</p><p>C</p><!-- more --><p>D</p>",
    "<p>A</p><p>B</p><p>C</p>",
    "<p>A</p><p>B</p><p>C</p><p>D</p>",
    true
  );

  test("<p>A<!-- more -->BCD</p>", "<p>A</p>", "<p>ABCD</p>", true);

  test(
    "<p>A<!-- more -->BCD</p><p>D</p>",
    "<p>A</p>",
    "<p>ABCD</p><p>D</p>",
    true
  );

  test(
    "Hello {{more}} there {{more}} is...",
    "Hello ",
    "Hello  there {{more}} is...",
    true
  );

  test(
    "Hello {{more}} there is more to come...",
    "Hello ",
    "Hello  there is more to come...",
    true
  );

  test(
    "<script>var a;</script><h1>A</h1><p>B</p><p>C</p><p>D</p><p>E</p><p>F</p><p>G</p>",
    "<script>var a;</script><h1>A</h1><p>B</p><p>C</p><p>D</p><p>E</p>",
    "<script>var a;</script><h1>A</h1><p>B</p><p>C</p><p>D</p><p>E</p><p>F</p><p>G</p>",
    true
  );

  test(
    "<h1>A</h1><p>B</p><p>C</p>",
    "<h1>A</h1><p>B</p><p>C</p>",
    "<h1>A</h1><p>B</p><p>C</p>",
    false
  );
})();

module.exports = makeTeaser;
