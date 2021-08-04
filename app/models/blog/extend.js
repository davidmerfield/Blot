var PUBLIC = require("./scheme").PUBLIC;
var config = require("config");
var url = require("./url");
var protocol = "https";
var punycode = require("helper/punycode");

if (config.environment === "development") protocol = "http";

module.exports = function extend(blog) {
  var pages = [];

  // External links have a timestamp
  // as their ID, pages have their entry ID
  for (var a in blog.menu)
    if (blog.menu[a].id.length < 10) pages.push(blog.menu[a]);

  // is it bad to extend the blog object here?
  blog.pretty = {};

  if (blog.dateFormat) blog["is" + blog.dateFormat] = "selected";

  // this is a hack and should be
  if (blog.menu && blog.menu.length) {
    for (var i in blog.menu) {
      // External links have a timestamp
      // as their ID, pages have their entry ID
      if (blog.menu[i].id[0] === "/") {
        blog.menu[i].isPage = true;
      }
    }

    blog.menu[blog.menu.length - 1].last = true;
  }

  // pages are used by the sitemap.
  blog.pages = pages;
  blog.showPages = pages.length > 0;
  blog.totalPages = pages.length;

  blog.feedURL = "/feed.rss";
  blog.url = protocol + "://" + blog.handle + "." + config.host;

  blog.pretty.url = blog.handle + "." + config.host;
  blog.pretty.label = blog.title || blog.pretty.url;

  if (blog.domain) {
    blog.url = protocol + "://" + blog.domain;
    blog.pretty.url = punycode.toUnicode(blog.domain);
    blog.pretty.domain = punycode.toUnicode(blog.domain);
  }

  // Based on the code in app/local.js this overwrites
  // the blog's URL when the simple local server is run
  if (config.host === 'localhost') {
    blog.url = 'http://localhost:8081';
    blog.pretty.url = 'localhost:8081';
  }

  blog.blogURL = protocol + "://" + blog.handle + "." + config.host;
  blog.cssURL = blog.cssURL || url.css(blog.cacheID);
  blog.scriptURL = blog.scriptURL || url.js(blog.cacheID);

  // Exposed to templates..
  blog.locals = {
    feedURL: blog.feedURL,
    blogURL: blog.blogURL,
    cssURL: blog.cssURL,
    scriptURL: blog.scriptURL,
  };

  // Import blog info into
  // rendering context
  for (var x in blog) if (PUBLIC.indexOf(x) > -1) blog.locals[x] = blog[x];

  return blog;
};
