var firstSentence = require("helper/firstSentence");
var titlify = require("./titlify");

function tidy(str) {
  return str.split("  ").join(" ").trim();
}

// Preferred order of title nodes
var order = ["h4", "h3", "h2", "h1"];

// Don't look down more than three nodes
var MAX_DEPTH = 3;

function extractTitle($, path) {
  var titleNode;
  var tag = "";
  var title = "";

  $.root().children().each(find);

  function find(i, node) {
    // We only look for a title in the first three top level nodes
    if (i >= MAX_DEPTH) return false;

    // Check if the tagName of the current
    // node beats our current best guess node,
    // which is stored as the variable titleNode.
    // Works by comparing their tag names...
    titleNode = best(titleNode, node);

    if (titleNode.name === "h1") return false;

    // We need to recurse down each child...
    $(node).children().each(find);
  }

  // We found a title tag
  if (titleNode && order.indexOf(titleNode.name) > -1) {
    title = tidy($(titleNode).text());

    if (titleNode.name === "h1") {
      $(titleNode).remove();
      tag = $.html($(titleNode));
    }
  } else if ($.root().children().first()) {
    title = tidy(firstSentence($.root().children().first().text()));
  }

  var body = $.html();

  title = title || titlify(path);

  return {
    title: title,
    tag: tag,
    body: body,
  };
}

// An earlier h1 tag beats a later h1 tag
function best(firstNode, secondNode) {
  if (!firstNode || !firstNode.name) return secondNode;

  if (!secondNode || !secondNode.name) return firstNode;

  if (order.indexOf(secondNode.name) > order.indexOf(firstNode.name))
    return secondNode;

  return firstNode;
}

module.exports = extractTitle;
