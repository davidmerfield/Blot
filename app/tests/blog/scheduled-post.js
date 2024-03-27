// Enable this test once we can run it in parallel
// it's too slow otherwise
xdescribe("scheduled posts", function () {
  const Template = require("models/template");
  const Blog = require("models/blog");
  const sync = require("sync");
  const blogServer = require("../../blog");
  const fs = require("fs-extra");
  const Express = require("express");
  const config = require("config");
  const guid = require("helper/guid");
  const moment = require("moment");
  const MINUTE = 60 * 1000;

  global.test.blog();

  it(
    "are published",
    function (done) {
      const path = "/entry.txt";
      const id = guid();
      sync(this.blog.id, (err, folder, finish) => {
        if (err) return callback(err);
        const contents = `Date: ${moment()
          .utc()
          .add(1, "minutes")
          .format("YYYY-MM-DD HH:mm")}\n\n${id}`;
        setTimeout(() => {
          request(this.origin, { strictSSL: false }, (err, res, body) => {
            expect(body).toContain(id);
            done();
          });
        }, MINUTE);
        fs.outputFileSync(this.blogDirectory + path, contents, "utf-8");
        folder.update(path, err => {
          if (err) return callback(err);
          finish(null, () => {
            request(this.origin, { strictSSL: false }, (err, res, body) => {
              expect(body).not.toContain(id);
            });
          });
        });
      });
    },
    MINUTE * 2
  );

  beforeEach(function (done) {
    const templateName = "example";

    const view = {
      name: "entries.html",
      content: `<html><head></head><body>{{#entries}}{{{html}}}{{/entries}}</body></html>`
    };

    Template.create(this.blog.id, templateName, {}, err => {
      if (err) return done(err);
      Template.getTemplateList(this.blog.id, (err, templates) => {
        let templateId = templates.filter(
          ({ name }) => name === templateName
        )[0].id;
        Template.setView(templateId, view, err => {
          if (err) return done(err);
          Blog.set(
            this.blog.id,
            { forceSSL: false, template: templateId },
            done
          );
        });
      });
    });
  });

  // Create a webserver for testing remote files
  beforeEach(function (done) {
    this.server = Express()
      .use((req, res, next) => {
        const _get = req.get;
        req.get = arg => {
          if (arg === "host") {
            return `${this.blog.handle}.${config.host}`;
          } else return _get(arg);
        };
        next();
      })
      .use(blogServer)
      .listen(8919, done);
    this.origin = "http://localhost:" + 8919;
  });

  afterEach(function (done) {
    this.server.close();
    done();
  });
});
