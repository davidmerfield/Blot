describe("depth property", function () {
  require("blog/tests/util/setup")();

  it("renders a depth property for each entry", async function () {
    await this.write({ path: "/1.txt", content: "Link: /1\n\nA" });
    await this.write({ path: "/2.txt", content: "Link: /1/2\n\nB" });

    await this.template({
      "entries.html": "{{#entries}}{{#depth}}{{{url}}}{{/depth}} {{/entries}}",
    });

    const res = await this.get(`/`);

    expect((await res.text()).trim().toLowerCase()).toEqual("2 1");
  });

  it("renders a depth property even with escaped input (two curly braces around url)", async function () {
    await this.write({ path: "/1.txt", content: "Link: /1\n\nA" });
    await this.write({ path: "/2.txt", content: "Link: /1/2\n\nB" });

    await this.template({
      "entries.html": "{{#entries}}{{#depth}}{{url}}{{/depth}} {{/entries}}",
    });

    const res = await this.get(`/`);

    expect((await res.text()).trim().toLowerCase()).toEqual("2 1");
  });

  it("lets you pass in your own text", async function () {

    await this.template({
      "entries.html": "{{#depth}}/1/2/3{{/depth}}",
    });

    const res = await this.get(`/`);

    expect((await res.text()).trim().toLowerCase()).toEqual("3");
  });

});
