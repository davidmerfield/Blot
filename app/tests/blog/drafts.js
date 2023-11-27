describe("drafts work", function () {
  const Template = require("models/template");
  const Blog = require("models/blog");
  const sync = require("sync");
  const blogServer = require("../../blog");
  const fs = require("fs-extra");
  const request = require("request");
  const Express = require("express");
  const config = require("config");
  const guid = require("helper/guid");

  global.test.blog();

  it("updates a draft dynamically", function (done) {
    const path = "/drafts/entry.txt";
    const firstContents = guid();
    const secondContents = guid();

    this.writeDraft(path, firstContents, (err) => {
      if (err) return done.fail(err);

      request(this.origin + "/draft/stream" + path, { strictSSL: false })
        .on("response", () => {
          this.writeDraft(path, secondContents, (err) => {
            if (err) return done.fail(err);
          });
        })
        .on("data", (data) => {
          data = data.toString().trim();
          if (!data) return;
          expect(data).toContain(secondContents);
          console.log("calling done... HERE!");
          done();
        });
    });
  });

  beforeEach(function (done) {
    const templateName = "example";

    const view = {
      name: "entry.html",
      content: `<html><head></head><body>{{{entry.html}}}</body></html>`,
    };

    Template.create(this.blog.id, templateName, {}, (err) => {
      if (err) return done(err);
      Template.getTemplateList(this.blog.id, (err, templates) => {
        let templateId = templates.filter(
          ({ name }) => name === templateName
        )[0].id;
        Template.setView(templateId, view, (err) => {
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
    let server;
    server = Express();
    server.use((req, res, next) => {
      const _get = req.get;
      req.get = (arg) => {
        if (arg === "host") {
          return `${this.blog.handle}.${config.host}`;
        } else return _get(arg);
      };
      next();
    });
    server.use(blogServer);
    this.origin = "http://localhost:" + 8919;
    this.server = server.listen(8919, done);

    this.writeDraft = (path, contents, callback) => {
      sync(this.blog.id, (err, folder, done) => {
        if (err) return callback(err);
        fs.outputFileSync(this.blogDirectory + path, contents, "utf-8");
        folder.update(path, function (err) {
          if (err) return callback(err);
          done(null, callback);
        });
      });
    };
  });

  afterEach(function (done) {
    this.server.close();
    done();
  });
});
