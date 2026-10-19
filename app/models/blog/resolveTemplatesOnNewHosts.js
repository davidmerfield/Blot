const { promisify } = require("util");
const blogHosts = require("blog/lib/blogHosts");
const clfdate = require("helper/clfdate");
const { mentionsHost } = require("./rebuildEntriesOnNewHosts");

// Template views have their links to the blog's own hosts
// (https://<host>/photo.jpg) wrapped in {{#cdn}} when they are saved
// (models/template/util/resolveFolderLinks), which only works for the hosts
// the blog had then. When a handle or domain is added, re-save the views of
// the blog's own templates that link to the new host, so their
// resolvedContent and CDN manifest pick it up.
//
// Like rebuildEntriesOnNewHosts, Blog.set calls this in the background. It
// never throws or calls back; the promise it returns always resolves, and
// only exists so a spec can wait.
//
// `former` is the blog as it was before the change.
module.exports = function resolveTemplatesOnNewHosts(blogID, former) {
  return run(blogID, former).catch(function (err) {
    log(blogID, "Error re-saving templates for new hosts", err);
  });
};

function log(blogID) {
  console.log.apply(null, [
    clfdate(),
    blogID.slice(0, 12),
    "resolveTemplatesOnNewHosts:",
    ...Array.prototype.slice.call(arguments, 1),
  ]);
}

async function run(blogID, former) {
  // Lazy: these modules require models/blog, which requires this module.
  const Blog = require("models/blog");
  const Template = require("models/template");
  const getTemplateList = promisify(Template.getTemplateList);
  const getAllViews = promisify(Template.getAllViews);
  const setView = promisify(Template.setView);

  if (!former || !former.handle) return;

  const blog = await new Promise((resolve, reject) =>
    Blog.get({ id: blogID }, (err, blog) => (err ? reject(err) : resolve(blog)))
  );

  if (!blog || !blog.handle) return;

  const formerHosts = blogHosts(former).map((host) => host.toLowerCase());
  const newHosts = blogHosts(blog)
    .map((host) => host.toLowerCase())
    .filter((host) => formerHosts.indexOf(host) === -1);

  if (!newHosts.length) return;

  let resaved = 0;

  for (const template of (await getTemplateList(blogID)) || []) {
    if (template.owner !== blogID) continue;

    const views = (await getAllViews(template.id)) || {};

    for (const name of Object.keys(views)) {
      if (!views[name] || !mentionsHost(views[name].content, newHosts)) continue;

      try {
        await setView(template.id, views[name]);
        resaved++;
      } catch (err) {
        log(blogID, "Error re-saving", template.id, name, err);
      }
    }
  }

  if (resaved) log(blogID, "Re-saved", resaved, "views linking to", newHosts);
}
