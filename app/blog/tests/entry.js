describe("augment", function () {
  const sync = require("sync");
  const fs = require("fs-extra");
  const blog = require("blog");
  const TEST_PORT = 3128;
  const fetch = require("node-fetch");
  const Blog = require("models/blog");
  const express = require("express");

  global.test.blog();

  beforeAll(function (done) {
    blog.listen(TEST_PORT, done);
  });

  beforeEach(function (done) {
    const ctx = this;
    Blog.set(ctx.blog.id, { domain: `localhost`, forceSSL: false }, err => {
      if (err) return done.fail(err);
      sync(ctx.blog.id, (err, folder, callback) => {
        fs.outputFileSync(
          ctx.blogDirectory + "/first.txt",
          "Link: first\n\nFoo"
        );

        fs.outputFileSync(
          ctx.blogDirectory + "/second.txt",
          "Tags: foo\nLink: second\n\nSecond"
        );

        fs.outputFileSync(
          ctx.blogDirectory + "/Templates/local/entry.html",
          `{{#entry}}
            {{{html}}} 
            {{^next.tagged.foo}}
            {{#next}}
            <p>Next: <a href='{{{url}}}'>{{title}}</a></p>
            {{/next}}
            {{/next.tagged.foo}}
            {{/entry}}`
        );

        fs.outputFileSync(
          ctx.blogDirectory + "/Templates/local/package.json",
          JSON.stringify({
            name: "local",
            locals: {},
            views: {},
            enabled: true
          })
        );

        folder.update("/first.txt", function (err) {
          if (err) return callback(err, done);
          folder.update("/second.txt", function (err) {
            if (err) return callback(err, done);
            callback(null, done);
          });
        });
      });
    });
  });

  it("augments entry.next and entry.previous", async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/first`);
    const body = await res.text();
    expect(body).not.toContain("<a href='/second'>");
  });
});
