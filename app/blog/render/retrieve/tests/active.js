describe("active property", function () {
  require("blog/tests/util/setup")();

  it("renders an 'active' property for each entry", async function () {
    await this.write({ path: "/1.txt", content: "Link: /1\n\nA" });
    await this.write({ path: "/2.txt", content: "Link: /2\n\nB" });

    await this.template({
      "entry.html": "{{#posts}}{{name}}:{{active}},{{/posts}}",
    });

    const res = await this.get(`/1`);

    expect((await res.text()).trim().toLowerCase()).toEqual(
      "2.txt:,1.txt:active,"
    );

    const res2 = await this.get(`/2`);

    expect((await res2.text()).trim().toLowerCase()).toEqual(
      "2.txt:active,1.txt:,"
    );
  });

  it("renders an 'active' property for template local arrays, based on the url", async function () {
    await this.template(
      {
        "foo.html": "{{#items}}{{label}}:{{active}},{{/items}}",
      },
      {
        locals: {
          items: [
            { label: "1", url: "/foo.html" },
            { label: "2", url: "/2" },
          ],
        },
      }
    );

    const res = await this.get(`/foo.html`);

    expect((await res.text()).trim().toLowerCase()).toEqual("1:active,2:,");
  });

  it("renders an 'active' property for the blog's menu", async function () {
    await this.blog.update({
      menu: [
        { id: "1", label: "Archives", url: "/archives" },
        { id: "2", label: "Feed", url: "/feed" },
      ],
    });

    await this.template(
      {
        "archives.html": "{{#menu}}{{label}}:{{active}},{{/menu}}",
      },
      {
        views: {
          "archives.html": {
            url: "/archives",
          },
        },
      }
    );

    const res = await this.get(`/archives`);

    expect((await res.text()).trim().toLowerCase()).toEqual(
      "archives:active,feed:,"
    );
  });
});
