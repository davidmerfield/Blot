var puncs = '?.!'.split('');
var MAX_LENGTH = 150;
var he = require('he');

function summary ($, title) {

  // We ignore the text content of
  // these tags for the summary
  // we only care about the content
  // of parapgraph tags for summaries
  // but these could sneak in
  $('pre, code, .katex, script, object, iframe, style, h1, h2, h3, h4, h5, h6').remove();

  // add a space before the end of
  // each node so newlines look ok
  $('p, blockquote').each(function(){
    $(this).append(' ');
  });

  var summary = $(':root').text();

  if (summary.length > MAX_LENGTH) {

    summary = summary.slice(0, MAX_LENGTH);

    summary = summary.trim();

    // and go to last whole word
    // what if its the only word?
    while (summary.indexOf(' ') > -1 && summary.slice(-1) !== ' ')
      summary = summary.slice(0, -1);

  }

  // Entries without titles will
  // have duplicate summaries
  if (summary && title && summary.indexOf(title) === 0) {
    summary = summary.slice(title.length, title.length + MAX_LENGTH).trim()  || '';
  }

  // Remove any trailing puntuation?
  while(summary && summary.length && puncs.indexOf(summary.slice(-1)) > -1)
    summary = summary.slice(0, -1) || '';

  summary = summary.trim();

  // since the summary is often used
  // {{}} which is encoded by mustache
  // we have to decode it in advance
  // because the HTML has already been
  // decoded by pandoc...!
  summary = he.decode(summary);

  return summary;
}

var cheerio = require('cheerio');
var assert = require('assert');

function is (html, expected, title) {

  var $ = cheerio.load(html, {decodeEntities: false});
  var output = summary($, title || '');

  try {
    assert(output === expected);
  } catch (e) {
    console.log('INPUT', html);
    console.log('OUTPUT', output);
    console.log('EXPECTED', expected);
  }

}

var longWord = 'helloooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo';


is('<p>H</p>', 'H');

// Handle inline elements nicely
is('<span>H</span><a href="">ello</a>', 'Hello');

// Check spaces are inserted between paragraphs
is('<p>H</p><p>E</p>', 'H E');

// Check blot ignores the title text
is('<p>Hello</p><p>there</p>', 'there', 'Hello');

// Check long results are trimmed to words
is('<p>Hello there ' + longWord + '.</p>', 'Hello there');

// Check the result is decoded
is('<p>Hello & foo</p><p>there</p>', 'Hello & foo there');
is('<p>Hello &amp; & foo</p><p>there</p>', 'Hello & & foo there');

module.exports = summary;