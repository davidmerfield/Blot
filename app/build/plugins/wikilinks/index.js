const async = require("async");
const ignore = "head, code, pre, script, style";
const cheerio = require("cheerio");
const caseSensitivePath = require("helper/caseSensitivePath");
const { join, resolve } = require("path");
const localPath = require("helper/localPath");
const makeSlug = require("helper/makeSlug");
const urlNormalizer = require("helper/urlNormalizer");

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
      const relativePath = resolve(dirname, href);

      const absolutePathWithMD = join("/", href + ".md");
      const absolutePath = join("/", href);

      // we could add other paths in future, or test
      // against post titles, for example.
      const paths = [
        relativePathWithMD,
        relativePath,
        absolutePathWithMD,
        absolutePath,
      ];

      function byTitle(href, done) {
        require("models/entries").getAll(blogID, function (allEntries) {
          const perfectMatch = allEntries.find((entry) => entry.title === href);

          if (perfectMatch) return done(null, perfectMatch);

          // Will trim, lowercase, remove punctuation, etc.
          const roughMatch = allEntries.find(
            (entry) => makeSlug(entry.title) === makeSlug(href)
          );

          if (roughMatch) return done(null, roughMatch);

          done(new Error("No entry found by title"));
        });
      }

      function byURL(href, done) {
        const normalizedHref = urlNormalizer(href);
        require("models/entry").getByUrl(blogID, normalizedHref, function (
          entry
        ) {
          if (entry) return done(null, entry);
          done(new Error("No entry found by URL"));
        });
      }

      function checkPath(path, done) {
        caseSensitivePath(root, path, function (err, absolutePath) {
          if (err || !absolutePath) return done(err || new Error("No path"));

          if (!absolutePath.startsWith(root))
            return done(new Error("Bad path"));

          const correctPath = join("/", absolutePath.slice(root.length));

          require("models/entry").get(blogID, correctPath, (entry) => {
            if (!entry) return done(new Error("No entry"));

            done(null, entry);
          });
        });
      }

      const lookups = [
        ...paths.map((path) => checkPath.bind(null, path)),
        byURL.bind(null, href),
        byTitle.bind(null, href),
      ];

      async.tryEach(lookups, function (err, entry) {
        if (entry) {
          const link = entry.url;
          const linkText = $(node).attr("data-text") || entry.title;

          $(node).attr("href", link).html(linkText).removeAttr("data-text");

          dependencies.push(entry.path);
        } else {
          // we failed to find a path, we should register paths to watch
          dependencies = dependencies.concat(paths);
        }

        next();
      });
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
