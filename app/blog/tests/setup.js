module.exports = () => {
  const sync = require("sync");
  const fs = require("fs-extra");
  const blog = require("blog");
  const TEST_PORT = 3128;
  const fetch = require("node-fetch");
  const Blog = require("models/blog");
  const express = require("express");

  global.test.blog();

  beforeAll(function (done) {
    this.fetch = (path, options) => {
      return fetch(`http://localhost:${TEST_PORT}${path}`, options);
    };
    blog.listen(TEST_PORT, done);
  });

  beforeEach(function (done) {
    const ctx = this;

    this.write = async (path, content) => {
      return await new Promise((resolve, reject) => {
        sync(ctx.blog.id, (err, folder, callback) => {
          fs.outputFileSync(ctx.blogDirectory + path, content);
          folder.update(path, function (err) {
            if (err) return callback(err, reject);
            callback(null, resolve);
          });
        });
      });
    };

    this.template = async views => {
      await this.write(
        "/Templates/local/package.json",
        JSON.stringify({
          name: "local",
          locals: {},
          views: {},
          enabled: true
        })
      );

      // views is an object with keys as the path and values as the content
      for (let path in views) {
        await this.write(`/Templates/local/${path}`, views[path]);
      }
    };

    Blog.set(ctx.blog.id, { domain: "localhost", forceSSL: false }, done);
  });
};
