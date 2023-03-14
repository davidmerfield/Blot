const sharp = require("sharp");

describe("rebuild", function () {
  // Set up a test blog before each test
  global.test.blog();

  const imageData = () =>
    sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: "#f00",
      },
    })
      .png()
      .toBuffer();

  it("will rebuild entries on blog", async function (done) {
    const path = "/Hello.txt";

    await this.blog.write({ path, content: "Title: Hello" });
    await this.blog.rebuild();
    await this.blog.check({ path, title: "Hello" });

    await this.blog.write({ path, content: "Title: Bye" });
    await this.blog.rebuild();
    await this.blog.check({ path, title: "Bye" });

    done();
  });

  it("will rebuild cached images on blog", async function (done) {
    const path = "/Hello.txt";

    await this.blog.write({ path, content: "![](_image.png)" });
    await this.blog.write({ path: "/_image.png", content: await imageData() });
    await this.blog.rebuild();

    const entry = await this.blog.check({ path });

    expect(entry.html).toContain("/_image_cache/");

    await this.blog.rebuild({ imageCache: true });

    const rebuiltEntry = await this.blog.check({ path });

    expect(rebuiltEntry.html).not.toEqual(entry.html);
    expect(entry.thumbnail).toEqual(rebuiltEntry.thumbnail);

    done();
  });

  it("will rebuild thumbnails on blog", async function (done) {
    const path = "/Hello.txt";

    await this.blog.write({ path, content: "![](_image.png)" });
    await this.blog.write({ path: "/_image.png", content: await imageData() });
    await this.blog.rebuild();

    const entry = await this.blog.check({ path });

    expect(entry.html).toContain("/_image_cache/");

    await this.blog.rebuild({ thumbnails: true });

    const rebuiltEntry = await this.blog.check({ path });

    expect(rebuiltEntry.html).toEqual(entry.html);
    expect(entry.thumbnail).not.toEqual(rebuiltEntry.thumbnail);

    done();
  });  
});
