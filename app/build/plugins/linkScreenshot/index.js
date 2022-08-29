const Url = require("url");
const { callbackify } = require("util");
const screenshot = callbackify(require("helper/screenshot"));
const { join } = require("path");
const config = require("config");
const uuid = require("uuid/v4");
const { is } = require("build/converters/webloc");

const SCREENSHOT_DIR = "_bookmark_screenshots";
const SCREENSHOT_WIDTH = 1060;
const SCREENSHOT_HEIGHT = 1060;

function render($, callback, { blogID, path }) {
  if (!is(path)) return callback();

  const link = $("p a.bookmark").first();
  const href = link.attr("href");
  const caption = link.html();
  const pathToScreenshot = join(blogID, SCREENSHOT_DIR, uuid() + ".png");
  const localPathToScreenshot = join(
    config.blog_static_files_dir,
    pathToScreenshot
  );

  const src = config.cdn.origin + "/" + pathToScreenshot;

  if (!href) return callback();

  try {
    Url.parse(href);
  } catch (e) {
    return callback();
  }

  screenshot(
    href,
    localPathToScreenshot,
    { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
    function () {
      $.root().html(
        `<p class="bookmark-container">
        <a class="bookmark-screenshot" href="${href}">
          <img width="${SCREENSHOT_WIDTH}" height="${SCREENSHOT_HEIGHT}" src="${src}" title="Screenshot of ${caption}" />
        </a>
        <a class="bookmark" href="${href}">${caption}</a>
       </p>`
      );

      return callback();
    }
  );
}

module.exports = {
  render,
  isDefault: true,
  category: "images",
  description: "Add a screenshot to posts from bookmarks",
};
