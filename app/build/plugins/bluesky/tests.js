describe("bluesky plugin", function () {
  const replaceURLsWithEmbeds = require("./index.js").render;
  const cheerio = require("cheerio");

  it("works", function () {
    // html bare link to a post on bluesky
    const html =
      '<a href="https://bsky.app/profile/logicallyjc.bsky.social/post/3lbretguxqk2b">https://bsky.app/profile/logicallyjc.bsky.social/post/3lbretguxqk2b</a>';

    const $ = cheerio.load(html);

    replaceURLsWithEmbeds($, function () {
      expect($("a").length).toBe(0);
      expect($("blockquote").length).toBe(1);
    });
  });

  it("does not error when there are no links", function () {
    const html = "<p>hello</p>";

    const $ = cheerio.load(html);

    replaceURLsWithEmbeds($, function () {
      expect($("a").length).toBe(0);
      expect($("blockquote").length).toBe(0);
    });
  });

  // if the bluesky link is invalid or poorly formatted, it should not be replaced
  it("does not error when the link is invalid", function () {
    const html = '<a href="https://bsky.app">https://bsky.app</a>';

    const $ = cheerio.load(html);

    replaceURLsWithEmbeds($, function () {
      expect($("a").length).toBe(1);
      expect($("blockquote").length).toBe(0);
    });
  });
});
