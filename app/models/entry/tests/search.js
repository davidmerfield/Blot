describe("entry.search", function () {
  require("./setup");

  it("works", async function (done) {
    const path = "/post.txt";
    const contents = "Hello, world!";

    await this.set(path, contents);

    const ids = await this.search("Hello");

    expect(ids[0].id).toEqual("/post.txt");

    done();
  });
});
