// An easy way to apply a function to each text node
// doThis accepts a text string of a text node's content
// and returns the modified string.

const IGNORE =
  'head, code, pre, script, style, [class^="pull-"], [class^="push-"], .small-caps';

module.exports = ($, doThis, options) => {
  let ignore = IGNORE;

  if (options && options.ignore) ignore += ", " + options.ignore;

  $(":root").each(function () {
    findTextNodes(this);
  });

  function findTextNodes(node) {
    if ($(node).is(ignore)) return false;

    $(node)
      .contents()
      .each(function () {
        const childNode = this;

        if (childNode.nodeType === 3) {
          let text = childNode.data;

          text = text.replace(/&#39;/g, "'");
          text = text.replace(/&quot;/g, '"');

          childNode.data = text;

          $(childNode).replaceWith(doThis(text, childNode, $));
        } else {
          findTextNodes(childNode);
        }
      });
  }

  return $;
};
