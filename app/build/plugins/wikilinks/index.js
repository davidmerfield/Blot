const async = require("async");
const ignore = "head, code, pre, script, style";
const Entry = require("models/entry");

// RegEx's inspired by this
// https://stackoverflow.com/questions/478857/wikilinks-turn-the-text-a-into-an-internal-link

// This will not work if the closing tag is separated from the opening tag
// by another node, e.g.
// [[hey <em>ehy</em> there]]
// But that kind of strikes me as a weird wikilink

function convertLinks(html) {
  if (html.indexOf("[[") === -1 || html.indexOf("]]") === -1) return html;

  // convert wikilinks with custom link text, e.g.
  // [[hello|world]]
  html = html.replace(
    /\[\[([^\]\|\r\n]+?)\|([^\]\|\r\n]+?)\]\]/gm,
    '<a href="$1" class="wikilink">$2</a>'
  );

  // convert wikilinks without custom link text, e.g.
  // [[hello]]
  html = html.replace(
    /\[\[([^\]\|\r\n]+?)\]\]/gm,
    '<a href="$1" class="wikilink">$1</a>'
  );

  return html;
}

function render($, callback, { blogID, path }) {
  $(":root").each(function findTextNodes(i, node) {
    if ($(node).is(ignore)) return false;

    $(node)
      .contents()
      .each((i, childNode) => {
        if (childNode.nodeType === 3) {
          $(childNode).replaceWith(convertLinks(childNode.data));
        } else {
          findTextNodes(childNode);
        }
      });
  });

  const wikilinks = $("a.wikilink");

  async.eachOf(
    wikilinks,
    function (node, i, next) {
      // The cheerio object contains other
      // shit. We only want img tag elements
      if (!node || node.name !== "a") return next();

      const href = $(node).attr("href");
      const dirname = require("path").dirname(path);
      const pathToLink = require("path").resolve(dirname, href + '.md');

      console.log('path:', path);
      console.log('dirname:', dirname);
      console.log('href:', href);
      console.log('pathToLink:', pathToLink)

      Entry.get(blogID, pathToLink, (entry) => {
        if (!entry || !entry.url) return next(err);

        $(node).attr("href", entry.url);
        next();
      });
    },
    callback
  );
}

module.exports = {
  render: render,
  category: "Typography",
  title: "Wikilinks",
  description: "Converts Wikilinks into links",
};
