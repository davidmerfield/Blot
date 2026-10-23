// Lists the blogs with entries which link to a real file in the blog's folder
// through one of the per-blog generated-asset prefixes (/_assets,
// /_image_cache, ...; see blog/lib/staticPaths).
//
// scripts/entry/rebuild-unbaked-folder-links.js never selects those entries,
// because a link under one of those prefixes is normally a generated asset,
// not a folder file, and would match on every run. But a blog can keep its own
// files under such a name (a folder called _assets/images), and the entries
// which link to them are only baked to CDN URLs if they are rebuilt for some
// other reason. This finds them: an entry is reported when a stored html,
// body, teaser or teaserBody link under one of those prefixes names a file
// which exists in the blog's folder, and which is not already baked.
//
// Read-only: it takes no lock and writes nothing. A reported entry is baked
// when it is next rebuilt (the folderAssets plugin has no such exclusion).
//
// Run it on a host which can reach the blog folders and Redis, e.g. inside
// the app container.
//
// Usage:
//   node scripts/entry/find-folder-files-in-static-paths.js [blog id, handle or domain] [--paths]
//
// With no blog argument every blog is scanned. --paths also lists each
// entry's path.

const Blog = require("models/blog");
const Entries = require("models/entries");
const config = require("config");
const blogHosts = require("blog/lib/blogHosts");
const BLOT_CDN_TOKEN = require("blog/render/replaceFolderLinks/cdnToken");
const { BLOG_STATIC_PATHS } = require("blog/lib/staticPaths");
const { hashFolderFile } = require("blog/render/replaceFolderLinks/folderFile");
const {
  htmlExtRegex,
  fileExtRegex,
  parseSrcset,
  hostPatterns: toHostPatterns,
  stripOwnHost,
  pathPartOf,
  decodeFolderPath,
} = require("blog/render/replaceFolderLinks/shared");

const FIELDS = ["html", "titleTag", "body", "teaser", "teaserBody"];

const ATTRIBUTE =
  /\b(href|src|poster|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

const args = process.argv.slice(2);
const listPaths = args.includes("--paths");
const identifier = args.find((arg) => !arg.startsWith("--"));

// The file path (decoded, with no query or hash) if the value is a link under
// one of the generated-asset prefixes, else null.
function staticPathLink(patterns, value) {
  if (!value || value.indexOf(BLOT_CDN_TOKEN) > -1) return null;

  value = stripOwnHost(patterns, value);

  if (value.charAt(0) !== "/" || value.startsWith("//")) return null;

  const pathPart = pathPartOf(value);

  if (htmlExtRegex.test(pathPart) || !fileExtRegex.test(pathPart)) return null;

  if (!BLOG_STATIC_PATHS.some((dir) => pathPart.startsWith(dir + "/")))
    return null;

  return decodeFolderPath(pathPart);
}

function linksIn(html, patterns) {
  const found = new Set();

  if (typeof html !== "string" || !html) return found;

  ATTRIBUTE.lastIndex = 0;

  let match;

  while ((match = ATTRIBUTE.exec(html))) {
    const attr = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4];

    const values =
      attr === "srcset"
        ? (parseSrcset(value) || []).map((candidate) => candidate.url)
        : [value];

    values.forEach((v) => {
      const path = staticPathLink(patterns, v);
      if (path) found.add(path);
    });
  }

  return found;
}

async function scanBlog(blog) {
  const patterns = toHostPatterns(
    blogHosts({ handle: blog.handle, domain: blog.domain })
  );
  const blogFolder = config.blog_folder_dir + "/" + blog.id;
  const exists = new Map(); // path -> Promise<boolean>
  const entries = []; // { path, files: [folder file paths] }

  const isFolderFile = (path) => {
    if (!exists.has(path))
      exists.set(path, hashFolderFile(blogFolder, path).then(Boolean));
    return exists.get(path);
  };

  const candidates = [];

  await new Promise((resolve, reject) =>
    Entries.each(
      blog.id,
      function (entry, next) {
        if (!entry.deleted) {
          const links = new Set();

          FIELDS.forEach((field) =>
            linksIn(entry[field], patterns).forEach((p) => links.add(p))
          );

          if (links.size) candidates.push({ path: entry.path, links });
        }

        setImmediate(next);
      },
      (err) => (err ? reject(err) : resolve())
    )
  );

  for (const { path, links } of candidates) {
    const files = [];

    for (const link of links) if (await isFolderFile(link)) files.push(link);

    if (files.length) entries.push({ path, files });
  }

  return entries;
}

function blogIDs() {
  if (!identifier) {
    return new Promise((resolve, reject) =>
      Blog.getAllIDs((err, ids) => (err ? reject(err) : resolve(ids || [])))
    );
  }

  // An explicit identifier must resolve: never fall back to every blog.
  const lookups =
    identifier.indexOf("blog_") === 0
      ? [{ id: identifier }]
      : [{ handle: identifier }, { domain: identifier }];

  return lookups
    .reduce(
      (found, query) =>
        found.then(
          (ids) =>
            ids ||
            new Promise((resolve, reject) =>
              Blog.get(query, (err, blog) =>
                err ? reject(err) : resolve(blog ? [blog.id] : null)
              )
            )
        ),
      Promise.resolve(null)
    )
    .then((ids) => {
      if (!ids) throw new Error(`No blog found for "${identifier}"`);
      return ids;
    });
}

async function main() {
  const ids = (await blogIDs()).slice().sort();
  const totals = { blogs: 0, blogsWithMatches: 0, entries: 0, errors: 0 };

  for (const blogID of ids) {
    const blog = await new Promise((resolve, reject) =>
      Blog.get({ id: blogID }, (err, blog) => (err ? reject(err) : resolve(blog)))
    );

    if (!blog || !blog.handle) continue;

    totals.blogs++;

    try {
      const entries = await scanBlog(blog);

      if (!entries.length) continue;

      const files = new Set();
      entries.forEach((entry) => entry.files.forEach((f) => files.add(f)));

      totals.blogsWithMatches++;
      totals.entries += entries.length;

      console.log(
        `${blog.handle} ${blog.id}: ${entries.length} entries link to ${files.size} folder files`
      );

      if (listPaths) entries.forEach((entry) => console.log(`  ${entry.path}`));
    } catch (err) {
      totals.errors++;
      console.error(`${blog.handle} ${blog.id}: failed:`, err.message || err);
    }
  }

  console.log("\n=== Folder files under generated-asset prefixes ===");
  console.log(`Blogs scanned: ${totals.blogs}`);
  console.log(`Blogs with entries to rebuild: ${totals.blogsWithMatches}`);
  console.log(`Entries to rebuild: ${totals.entries}`);
  console.log(`Errors: ${totals.errors}`);

  return totals.errors === 0;
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
