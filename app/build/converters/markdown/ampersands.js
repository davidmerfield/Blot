// Why do we need to think about ampersands? Well, because ampersands (&) are invalid HTML unless
// escaped as &amp;. Markdown converts transform an unescaped ampersand in text into an escaped 
// ampersand. Pandoc, however, gets upset about unescaped ampersands in HTML snippets inside 
// Markdown files. For example:

// <a href="/?foo=bar&baz=bat">a</a> is returned as a literal string instead of HTML while:
// <a href="/?foo=bar&amp;baz=bat">a</a> is properly processed. Read more here:

// https://github.com/jgm/pandoc/issues/2410

// So to get around this, we first escape all ampersands before passing the text to pandoc. Ideally
// we would only do this for the HTML in the markdown but I'm not sure how to do that.

// However, once we've done this, Pandoc doubly escapes our already escaped ampersands inside
// code blocks, e.g. ```&``` becomes <pre>&amp;amp;</pre> so we run a second method after the
// conversion in Pandoc to de-double escape the ampersands.

// I think that while JGM is technically correct, this should all be the responsibility of the markdown
// converter itself, but oh well...

module.exports = {
  // This regex replaces unescaped amerpersands (and leaves escaped ones)
  // I found the regex here:
  // http://stackoverflow.com/questions/636781/any-pitfalls-with-this-regex-that-matches-ampersands-not-already-encoded
  escape: function(text) {
    return text.replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;");
  },

  deDoubleEscape: function(text) {
    return text.split("&amp;amp;").join("&amp;");
  }
};
