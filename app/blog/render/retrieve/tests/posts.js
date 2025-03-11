describe("posts", function () {
  require("blog/tests/util/setup")();

  it("lists posts", async function () {
    await this.write({ path: "/a.txt", content: "Foo" });
    await this.write({ path: "/b.txt", content: "Bar" });
    await this.write({ path: "/c.txt", content: "Baz" });
    await this.write({ path: "/d.txt", content: "Qux" });
    await this.write({ path: "/e.txt", content: "Quux" });

    await this.template(
      {
        "foo.html": `{{#posts}}{{{summary}}} {{/posts}}`,
      },
      {
        views: {
          "foo.html": {
            url: ["/foo", "/foo/page/:page"],
          },
        },
        locals: {
          page_size: 3,
        },
      }
    );

    const res = await this.get("/foo");
    const text = await res.text();

    expect(text.trim()).toEqual("Quux Qux Baz");

    const res2 = await this.get("/foo/page/2");
    const text2 = await res2.text();
    expect(text2.trim()).toEqual("Bar Foo");
  });
});
