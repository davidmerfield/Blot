describe("routing", function () {
  require("./util/setup")();

  it("retrieves template views with params", async function () {
    await this.write({ path: "/post.txt", content: "Foo" });

    await this.template(
      {
        "example.html": "Success",
      },
      {
        views: {
          "example.html": {
            name: "example.html",
            url: ["/eg/page/:page", "/e g", "/ë"],
          },
        },
      }
    );

    // Test with params
    const res = await this.get(`/eg/page/1`);
    const body = await res.text();
    
    expect(body).toContain("Success");

    // Test without params
    const res2 = await this.get(`/eg/page/x`);
    const body2 = await res2.text();

    expect(body2).toContain("Success");

    // Test spaces
    const res3 = await this.get(`/e%20g`);
    const body3 = await res3.text();

    expect(body3).toContain("Success");

    // Test accented characters
    const res4 = await this.get(`/ë`);
    const body4 = await res4.text();

    expect(body4).toContain("Success");
  });

  it("when there are duplicate URLs, router will serve a template view, then an entry, then a file in that order", async function () {
    // Prepare the template, entry, and file
    await this.write({
      path: "/foo.txt",
      content: "Link: /about.txt\n\nENTRY",
    });
    await this.template({ "about.txt": "VIEW" });
    await this.write({ path: "/about.txt", content: "FILE" });

    // Check that the template view is served first
    const res = await this.get("/about.txt");
    const body = await res.text();
    expect(res.status).toEqual(200);
    expect(body.trim()).toEqual("VIEW");

    // remove the template view
    await this.template({ "entry.html": "{{{entry.html}}}" });

    // Check that the entry is served next
    const res2 = await this.get("/about.txt");
    const body2 = await res2.text();
    expect(res2.status).toEqual(200);
    expect(body2.trim()).toContain("ENTRY");

    // remove the entry
    await this.remove("/foo.txt");

    // Check that the file is served last
    const res3 = await this.get("/about.txt");
    const body3 = await res3.text();
    expect(res3.status).toEqual(200);
    expect(body3.trim()).toEqual("FILE");
  });
});
