describe("template engine", function () {
  require("./setup")();

  it("lists entries in reverse chronological", async function () {
    await this.write("/first.txt", "Foo");
    await this.write("/second.txt", "Bar");

    await this.template({
      "entries.html":
        "{{#entries}}<p><a href='{{{url}}}'>{{title}}</a></p>{{/entries}}"
    });

    const res = await this.fetch(`/`);

    expect((await res.text()).trim().toLowerCase()).toEqual(
      "<p><a href='/second'>second</a></p><p><a href='/first'>first</a></p>"
    );
  });

  it("renders a list of posts with a given tag", async function () {
    await this.write("/[Foo]/first.txt", "Foo");
    await this.write("/[Foo]/second.txt", "Bar");

    await this.template({
      "tagged.html":
        "{{#tagged}}{{#entries}}<p><a href='{{{url}}}'>{{title}}</a></p>{{/entries}}{{/tagged}}"
    });

    const res = await this.fetch(`/tagged/foo`);

    expect((await res.text()).trim().toLowerCase()).toEqual(
      "<p><a href='/second'>second</a></p><p><a href='/first'>first</a></p>"
    );
  });

  it("augments entry.next and entry.previous", async function () {
    await this.write("/first.txt", "Link: first\n\nFoo");
    await this.write("/second.txt", "Tags: foo\nLink: second\n\nSecond");

    await this.template({
      "entry.html": `
        {{#entry}}
          {{{html}}} 
          {{^next.tagged.foo}}
          {{#next}}
          <p>Next: <a href='{{{url}}}'>{{title}}</a></p>
          {{/next}}
          {{/next.tagged.foo}}
        {{/entry}}
      `
    });

    const res = await this.fetch(`/first`);

    expect(await res.text()).not.toContain("<a href='/second'>");
  });
});
