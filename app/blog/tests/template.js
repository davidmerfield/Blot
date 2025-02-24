describe("template engine", function () {
  
  require("./util/setup")();

  it("lists entries in reverse chronological", async function () {
    await this.write({path: "/first.txt", content: "Foo"});
    await this.write({path: "/second.txt", content: "Bar"});

    await this.template({
      "entries.html":
        "{{#entries}}<p><a href='{{{url}}}'>{{title}}</a></p>{{/entries}}"
    });

    const res = await this.get(`/`);

    expect((await res.text()).trim().toLowerCase()).toEqual(
      "<p><a href='/second'>second</a></p><p><a href='/first'>first</a></p>"
    );
  });

  it("renders a list of posts with a given tag", async function () {
    await this.write({path: "/[Foo]/first.txt", content: "Foo"});
    await this.write({path: "/[Foo]/second.txt", content: "Bar"});

    await this.template({
      "tagged.html":
        "{{#tagged}}{{#entries}}<p><a href='{{{url}}}'>{{title}}</a></p>{{/entries}}{{/tagged}}"
    });

    const res = await this.get(`/tagged/foo`);

    expect((await res.text()).trim().toLowerCase()).toEqual(
      "<p><a href='/second'>second</a></p><p><a href='/first'>first</a></p>"
    );
  });

  it("augments entry.next and entry.previous", async function () {
    await this.write({path: "/first.txt", content: "Link: first\n\nFoo"});
    await this.write({path: "/second.txt", content: "Tags: foo\nLink: second\n\nSecond"});

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

    const res = await this.get(`/first`);

    expect(await res.text()).not.toContain("<a href='/second'>");
  });

  it("embeds the HTML for a given post as a partial template, including lowercase", async function () {
    await this.write({path: "/hello.txt", content: "Foo"});

    // We're interested in testing lowercase because the Dropbox client
    // stores all files in lowercase.
    await this.template({
      "entries.html": "{{> /Hello.txt}} {{> /hello.txt}}"
    });

    const res = await this.get(`/`);

    expect((await res.text()).trim().toLowerCase()).toEqual(
      "<p>foo</p><p>foo</p>"
    );
  });
});
