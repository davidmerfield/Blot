const lowerCase = require("clients/dropbox/routes/setup/lowerCase");
const promisify = require("util").promisify;
const fs = require("fs-extra");
const { join } = require("path");
const entries = require("models/entries");

describe("dropbox lowerCase", function () {
  // Create test blog
  global.test.blog();

  beforeEach(function (done) {
    const ctx = this;
    const sync = require("sync");
    const blogID = this.blog.id;
    sync(blogID, async function (err, folder, complete) {
      if (err) return done(err);
      ctx.folder = folder;
      ctx.complete = complete;
      done();
    });
  });

  afterEach(function (done) {
    this.complete(null, done);
  });

  it("lowercases all files in blog folder", async function (done) {
    const folder = this.folder;
    const update = promisify(folder.update);

    await fs.outputFile(join(folder.path, "/baR/fOo.txt"), "hey");
    await update("/baR/fOo.txt", {});

    await fs.outputFile(join(folder.path, "baR.txt"), "bar");
    await update("baR.txt", {});

    await lowerCase(folder.path, update);

    entries.getAll(this.blog.id, function (entries) {
      console.log(entries.map((i) => i.path));
      done();
    });
  });
});
