/**
 * Replace doubly-encoded ampersands e.g. &amp; with non-encoded e.g. &.
 *
 * Note: this isn't terribly robust & only handles ampersands encoded as HTML
 * named-entities. This doesn't handle URL encoding & so forth.
 */
module.exports = function (str) {
  return String(str).replace(/&amp;/g, "&");
}
