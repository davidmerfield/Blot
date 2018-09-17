var helper = require('helper');
var firstSentence = helper.firstSentence;
var titlify = helper.titlify;

function tidy (str) {
  return str.split('  ').join(' ').trim();
}

// Preferred order of title nodes
var order = ['h4', 'h3', 'h2', 'h1'];

// Don't look down more than three nodes
var MAX_DEPTH = 3;

function extractTitle ($, path) {

  var titleNode;
  var tag = '';
  var title = '';

  $.root().children().each(find);

  function find (i, node){

    // We only look for a title in the first three top level nodes
    if (i >= MAX_DEPTH) return false;

    // Check if the tagName of the current
    // node beats our current best guess node,
    // which is stored as the variable titleNode.
    // Works by comparing their tag names...
    titleNode = best(titleNode, node);

    if (titleNode.name === 'h1') return false;

    // We need to recurse down each child...
    $(node).children().each(find);
  }


  // We found a title tag
  if (titleNode && order.indexOf(titleNode.name) > -1) {

    title = tidy($(titleNode).text());
    tag = $.html($(titleNode));

    $(titleNode).remove();

  } else if ($.root().children().first()) {

    title = tidy(firstSentence($.root().children().first().text()));

  }

  var body = $.html();

  title = title || titlify(path);

  return {
    title: title,
    tag: tag,
    body: body
  };
}

// An earlier h1 tag beats a later h1 tag
function best (firstNode, secondNode) {

  if (!firstNode || !firstNode.name)
    return secondNode;

  if (!secondNode || !secondNode.name)
    return firstNode;

  if (order.indexOf(secondNode.name) > order.indexOf(firstNode.name))
    return secondNode;

  return firstNode;
}

var assert = require('assert');
var type = helper.type;
var cheerio = require('cheerio');

function tests () {

  function is (html, path, expected) {

    if (!expected && type(path === 'array')) {
      expected = path;
      path = '/';
    }

    var $ = cheerio.load(html, {decodeEntities: false});

    var res = extractTitle($, path);

    try {

      assert.deepEqual(res.title, expected[0], 'Title');
      assert.deepEqual(res.tag,  expected[1], 'Tag');
      assert.deepEqual(res.body, expected[2], 'Body');

    } catch (e) {

      console.log('------- INPUT --------');
      console.log(html);
      console.log('------- TITLE --------');
      console.log('RESULT:', res.title);
      console.log('EXPECTED:', expected[0]);
      console.log('-------- TAG ---------');
      console.log('RESULT:', res.tag);
      console.log('EXPECTED:', expected[1]);
      console.log('-------- BODY ---------');
      console.log(res.body);
      console.log('------ EXPECTED ------');
      console.log(expected[2]);
      console.log('------------------------');

      throw e;
    }
  }

  // Normal post
  is('<h1>Hello</h1><p>Foo</p>', [
    'Hello',
    '<h1>Hello</h1>',
    '<p>Foo</p>'
  ]);

  // No H1
  is('<p>Bar</p>', [
    'Bar',
    '',
    '<p>Bar</p>'
  ]);

  // Attributes and nested childnodes
  is('<h1 id="foo" data-bar="baz">A<span class="B">C<i>D</i></span></h1>', [
    'ACD',
    '<h1 id="foo" data-bar="baz">A<span class="B">C<i>D</i></span></h1>',
    ''
  ]);

  // H1 not first node
  is('<p>Bar</p><h1>Bat</h1><h2>Foo</h2><p>count</p>', [
    'Bat',
    '<h1>Bat</h1>',
    '<p>Bar</p><h2>Foo</h2><p>count</p>'
  ]);

  // H1 is third child
  is('<h3>Bar</h3><h2>Bat</h2><h1>Foo</h1><p>Fuck</p>', [
    'Foo', '<h1>Foo</h1>', '<h3>Bar</h3><h2>Bat</h2><p>Fuck</p>'
  ]);

  // Nested first H1
  is('<div id="container"><div id="o"><div id="i"><h1>X</h1></div><h1>Y</h1></div><h1>Z</h1><p>A</p></div>', [
    'X',
    '<h1>X</h1>',
    '<div id="container"><div id="o"><div id="i"></div><h1>Y</h1></div><h1>Z</h1><p>A</p></div>'
  ]);

  // Fallback to filename
  is('<a href="//"></a>', '/another_Name.txt', [
    'another Name',
    '',
    '<a href="//"></a>'
  ]);

  // Fallback to filename
  is('', 'file-name.txt', [
    'file name',
    '',
    ''
  ]);

  // Fallback to filename
  is('', '[bar]file-name.txt', [
    'file name',
    '',
    ''
  ]);

  // H1 comes late in post
  is('<p>A</p><p>B</p><p>C</p><p>D</p><p>E</p><h1>Y</h1><h2>X</h2>', 'file-name.txt', [
    'A',
    '',
    '<p>A</p><p>B</p><p>C</p><p>D</p><p>E</p><h1>Y</h1><h2>X</h2>'
  ]);

}

tests();

module.exports = extractTitle;