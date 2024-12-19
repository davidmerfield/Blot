describe("flickr plugin", function () {
  const replaceURLsWithEmbeds = require("./index.js").render;
  const cheerio = require("cheerio");

  it("works for short flickr URLs", function (done) {
    // html bare link to a post on bluesky
    const html =
      '<a href="https://flic.kr/p/2quEvYr">https://flic.kr/p/2quEvYr</a>';

    const $ = cheerio.load(html);

    replaceURLsWithEmbeds($, function () {
      expect($("a[href='https://flic.kr/p/2quEvYr']").length).toBe(0);
      expect($("a[data-flickr-embed='true']").length).toBe(1);
      expect($("img").length).toBe(1);
      expect($("script").length).toBe(1);
      done();
    });
  });

  it("works for full flickr URLs", function (done) {
    const html =
      '<a href="https://www.flickr.com/photos/jemostrom/54145631949/">https://www.flickr.com/photos/jemostrom/54145631949/<a>';

    const $ = cheerio.load(html);

    replaceURLsWithEmbeds($, function () {
      console.log("html:", $.html());

      expect(
        $("a[href='https://www.flickr.com/photos/jemostrom/54145631949/']")
          .length
      ).toBe(1);
      expect($("a[data-flickr-embed='true']").length).toBe(1);
      expect($("img").length).toBe(1);
      expect($("script").length).toBe(1);
      done();
    });
  });

  it("does not error when there are no links", function (done) {
    const html = "<p>hello</p>";

    const $ = cheerio.load(html);

    replaceURLsWithEmbeds($, function () {
      expect($("a").length).toBe(0);
      expect($("blockquote").length).toBe(0);
      done();
    });
  });

  // if the flickr link is invalid or poorly formatted, it should not be replaced
  it("does not error when the flickr link is invalid", function (done) {
    const html = '<a href="https://bsky.app">https://bsky.app</a>';

    const $ = cheerio.load(html);

    replaceURLsWithEmbeds($, function () {
      expect($("a").length).toBe(1);
      expect($(".flickr-embed").length).toBe(0);
      expect($("img").length).toBe(0);
      expect($("script").length).toBe(0);
      done();
    });
  });
});
