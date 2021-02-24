const fs = require("fs-extra");
const markdown = require("build/converters/markdown/index");

describe("markdown converter", function () {
  global.test.blog();

  fs.readdirSync(__dirname)
    .filter((file) => file.slice(-4) === ".txt")
    .forEach((file) => {
      it("handles " + file.slice(0, -4).split("-").join(" "), function (done) {
        // Copy the .bib and csl files to the root of the blog folder
        fs.copySync(__dirname + "/files", this.blogDirectory);
        fs.copySync(__dirname, this.blogDirectory);

        const path = "/" + file;
        markdown.read(this.blog, path, {}, function (err, html) {
          if (err) return done.fail(err);

          let expected;

          try {
            html = html.replace(/"#?footnote-[A-Z\d]{1,6}"/gm, '"#footnote-ID_REMOVED"');
            html = html.replace(/"#?ref-[A-Z\d]{1,6}"/gm, '"#ref-ID_REMOVED"');

            expected = fs.readFileSync(__dirname + path + ".html", "utf8");
            expected = expected.replace(/"#?footnote-[A-Z\d]{1,6}"/gm, '"#footnote-ID_REMOVED"');
            expected = expected.replace(/"#?ref-[A-Z\d]{1,6}"/gm, '"#ref-ID_REMOVED"');
          } catch (e) {
            console.log(e);
            fs.outputFileSync(__dirname + path + ".expected.html", html);
          }

          if (html !== expected)
            fs.outputFileSync(__dirname + path + ".expected.html", html);

          expect(expected).toEqual(html);
          done();
        });
      });
    });
});
