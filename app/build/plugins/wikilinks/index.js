const { tryEach, eachOf } = require("async");
const { resolve, dirname } = require("path");
const ignore = "head, code, pre, script, style";
const cheerio = require("cheerio");
const byPath = require("./byPath");
const byURL = require("./byURL");
const byTitle = require("./byTitle");

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
    const custom = linkContents.indexOf("|") > -1;

    // Handle wikilinks with custom text, e.g. [[../hello|Hey!]]
    if (custom) {
      href = linkContents.slice(0, linkContents.indexOf("|"));
      text = linkContents.slice(linkContents.indexOf("|") + 1);
    }

    // It is neccessary to add the data-text attribute because
    // other plugins can mess with the link contents (e.g. typeset)
    return `<a href="${href}" class="wikilink" ${custom ? `data-text="${text}"` : ""}>${text}</a>`;
  });
  return html;
}

// we use a pre-rendering function since it's important
// that wikilinks are converted before typeset is run

function prerender(html, callback) {
  // Don't decode entities, preserve the original content
  var $ = cheerio.load(html, { decodeEntities: false });

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

  callback(null, $.html());
}

function render($, callback, { blogID, path }) {
  const wikilinks = $("a.wikilink");
  let dependencies = [];

  eachOf(
    wikilinks,
    function (node, i, next) {
      // The cheerio object contains other
      // shit. We only want img tag elements
      if (!node || node.name !== "a") return next();

      const href = $(node).attr("href");

      const lookups = [
        byPath.bind(null, blogID, path, href),
        byURL.bind(null, blogID, href),
        byTitle.bind(null, blogID, href),
      ];

      tryEach(lookups, function (err, entry) {
        if (entry) {
          const link = entry.url;
          const linkText = $(node).attr("data-text") || entry.title;

          $(node).attr("href", link).html(linkText).removeAttr("data-text");

          console.log("adding dependency", entry.path, "to post:", path);
          dependencies.push(entry.path);
        } else {
          // we failed to find a path, we should register paths to watch
          // if pathOfPost is '/Posts/foo.txt' then dirOfPost is '/Posts'
          const dirOfPost = dirname(path);

          // if href is 'sub/Foo.txt' and dirOfPost is '/Posts' then
          // resolvedHref is '/Posts/sub/Foo.txt'
          const resolvedHref = resolve(dirOfPost, href);

          const pathsToWatch = [
            resolvedHref,
            resolvedHref + ".md",
            resolvedHref + ".txt",
          ];

          pathsToWatch.forEach((path) => dependencies.push(path));
        }
        next();
      });
    },
    function () {
      console.log(
        "wikilinks:",
        path,
        "calling back with dependencies",
        dependencies
      );
      callback(null, dependencies);
    }
  );
}
module.exports = {
  prerender,
  render,
  category: "Typography",
  title: "Wikilinks",
  description: "Convert Wikilinks into links",
};
