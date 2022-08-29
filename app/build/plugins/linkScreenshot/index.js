const Url = require("url");
const { callbackify } = require("util");
const screenshot = callbackify(require("helper/screenshot"));
const { join } = require("path");
const config = require("config");
const uuid = require("uuid/v4");

const screenshot_directory = "_webloc_screenshots";

function render($, callback, { blogID }) {
  const link = $("p a.bookmark").first();
  const href = link.attr("href");

  const name = uuid() + ".png";
  const path = join(
    config.blog_static_files_dir,
    blogID,
    screenshot_directory,
    name
  );

  const src =
    config.cdn.origin + "/" + blogID + "/" + screenshot_directory + "/" + name;

  if (!href) return callback();

  try {
    Url.parse(href);
  } catch (e) {
    return callback();
  }

  screenshot(href, path, { width: 1060, height: 1060 }, function () {
    $.root().prepend(
      `<p><a class="bookmark-screenshot" href="${href}"><img width="1060" height="1060" src="${src}" /></a></p>`
    );
    return callback();
  });
}

module.exports = {
  render,
  isDefault: true,
  category: "images",
  description: "Add a screenshot of linked bookmark posts",
};
