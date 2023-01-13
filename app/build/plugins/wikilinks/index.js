const async = require("async");
const ignore = "head, code, pre, script, style";

// RegEx's inspired by this
// https://stackoverflow.com/questions/478857/wikilinks-turn-the-text-a-into-an-internal-link

// This will not work if the closing tag is separated from the opening tag
// by another node, e.g.
// [[hey <em>ehy</em> there]]
// But that kind of strikes me as a weird wikilink

function convertLinks(html) {
  html = html.replace(/\[\[(.+?)\]\]/g, function (match, linkContents) {
    let text = linkContents;
    let href = linkContents;

    // Handle wikilinks with custom text, e.g. [[../hello|Hey!]]
    if (linkContents.indexOf("|") > -1) {
      href = linkContents.slice(0, linkContents.indexOf("|"));
      text = linkContents.slice(linkContents.indexOf("|") + 1);
    }

    return `<a href="${href}" class="wikilink">${text}</a>`;
  });
  return html;
}

function render($, callback, { blogID, path }) {
  let dependencies = [];

  $(":root").each(function findTextNodes(i, node) {
    if ($(node).is(ignore)) return;

    $(node)
      .contents()
      .each((i, childNode) => {
        if (childNode.nodeType === 3) {
          $(childNode).replaceWith(convertLinks(childNode.data));
        } else {
          findTextNodes(i, childNode);
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

      // We can't trust this href - it could belong to a file outside the blog
      // folder for this blog with sufficient ../../../
      const pathToLinkWithMD = require("path").resolve(dirname, href + ".md");

      // we could add other paths in future, or test
      // against post titles, for example.
      const paths = [pathToLinkWithMD];

      dependencies = dependencies.concat(paths);

      require("models/entry").get(blogID, paths, (entries) => {
        if (!entries || !entries.length) return next();
        let entry = entries.shift();
        $(node).attr("href", entry.url);
        next();
      });
    },
    function (err) {
      callback(null, dependencies);
    }
  );
}

module.exports = {
  render: render,
  category: "Typography",
  title: "Wikilinks",
  description: "Convert Wikilinks into links",
};
