const async = require("async");
const ignore = "head, code, pre, script, style";
const cheerio = require("cheerio");
const caseSensitivePath = require("helper/caseSensitivePath");
const { join, resolve } = require("path");
const localPath = require("helper/localPath");

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

    return `<a href="${href}" class="wikilink${custom ? " custom-text" : ""}">${text}</a>`;
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
  const root = localPath(blogID, "/");

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
      const relativePathWithMD = resolve(dirname, href + ".md");
      const relativePathWithTXT = resolve(dirname, href + ".txt");
      const relativePath = resolve(dirname, href);

      const absolutePathWithMD = join("/", href + ".md");
      const absolutePathWithTXT = join("/", href + ".txt");
      const absolutePath = join("/", href);

      // we could add other paths in future, or test
      // against post titles, for example.
      const paths = [
        relativePathWithMD,
        relativePathWithTXT,
        relativePath,
        absolutePathWithMD,
        absolutePathWithTXT,
        absolutePath,
      ];

      function checkPath(path, done) {
        caseSensitivePath(root, path, function (err, absolutePath) {
          if (err || !absolutePath) return done(err || new Error("No path"));

          if (!absolutePath.startsWith(root))
            return done(new Error("Bad path"));

          const correctPath = join("/", absolutePath.slice(root.length));

          require("models/entry").get(blogID, correctPath, (entry) => {
            if (!entry) return done(new Error("No entry"));

            done(null, { entry, correctPath });
          });
        });
      }

      async.tryEach(
        paths.map((path) => checkPath.bind(null, path)),
        function (err, result) {
          if (result) {
            const { entry, correctPath } = result;
            $(node).attr("href", entry.url);
            if (!$(node).hasClass("custom-text")) $(node).html(entry.title);
            dependencies.push(correctPath);
          } else {
            // we failed to find a path, we should register paths to watch
            dependencies = dependencies.concat(paths);
          }

          next();
        }
      );
    },
    function (err) {
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
