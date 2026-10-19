describe("Blog.set re-saves template views linking to a new handle or domain", function () {
  var { promisify } = require("util");
  var Blog = require("models/blog");
  var Template = require("models/template");
  var resolveTemplatesOnNewHosts = require("../resolveTemplatesOnNewHosts");

  global.test.blog();

  var getBlog = (blogID) =>
    new Promise((resolve, reject) =>
      Blog.get({ id: blogID }, (err, blog) => (err ? reject(err) : resolve(blog)))
    );

  var setBlog = (blogID, updates) =>
    new Promise((resolve, reject) =>
      Blog.set(blogID, updates, (err) => (err ? reject(err) : resolve()))
    );

  var getView = promisify(Template.getView);

  // Blog.set re-saves in the background, so wait for the result (within
  // the spec's own timeout, below).
  var waitFor = async (check) => {
    var end = Date.now() + 10000;

    while (Date.now() < end) {
      if (await check()) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  };

  var wrapped = (path) => "{{#cdn}}" + path + "{{/cdn}}";

  beforeEach(async function () {
    await promisify(Template.create)(this.blog.id, "template", {});

    var templates = await promisify(Template.getTemplateList)(this.blog.id);

    this.template = templates.filter(
      (t) => t.name === "template" && t.owner === this.blog.id
    )[0];

    var setView = promisify(Template.setView);

    await setView(this.template.id, {
      name: "linked.html",
      content: '<img src="https://new.example.com/file.png">',
    });
    await setView(this.template.id, {
      name: "other.html",
      content: '<img src="https://other.example.org/file.png">',
    });
  });

  it("wraps links on a newly added domain, leaving other hosts alone", async function () {
    var before = await getView(this.template.id, "linked.html");

    // The domain isn't the blog's yet, so it is just another host.
    expect(before.resolvedContent).toBeUndefined();

    await setBlog(this.blog.id, { domain: "new.example.com" });

    var resaved = await waitFor(async function () {
      var view = await getView(this.template.id, "linked.html");
      return !!view.resolvedContent;
    }.bind(this));

    expect(resaved).toBe(true);

    var linked = await getView(this.template.id, "linked.html");
    var other = await getView(this.template.id, "other.html");

    expect(linked.content).toBe('<img src="https://new.example.com/file.png">');
    expect(linked.resolvedContent).toContain(wrapped("/file.png"));
    expect(other.resolvedContent).toBeUndefined();
  }, 20000);

  it("re-saves views that mention a new host when called directly", async function () {
    var former = await getBlog(this.blog.id);

    await setBlog(this.blog.id, { domain: "new.example.com" });
    await resolveTemplatesOnNewHosts(this.blog.id, former);

    var linked = await getView(this.template.id, "linked.html");

    expect(linked.resolvedContent).toContain(wrapped("/file.png"));
  });

  it("does not re-save views that don't mention the new hosts", async function () {
    var former = await getBlog(this.blog.id);

    await setBlog(this.blog.id, { domain: "unused.example.com" });

    var setView = spyOn(Template, "setView").and.callThrough();

    await resolveTemplatesOnNewHosts(this.blog.id, former);

    expect(setView).not.toHaveBeenCalled();

    var linked = await getView(this.template.id, "linked.html");

    expect(linked.resolvedContent).toBeUndefined();
  });

  it("re-saves only the views that mention the new host", async function () {
    var former = await getBlog(this.blog.id);

    await setBlog(this.blog.id, { domain: "new.example.com" });

    var setView = spyOn(Template, "setView").and.callThrough();

    await resolveTemplatesOnNewHosts(this.blog.id, former);

    var names = setView.calls.allArgs().map((args) => args[1].name);

    expect(names).toContain("linked.html");
    expect(names).not.toContain("other.html");
  });
});
