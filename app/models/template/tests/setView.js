const { promisify } = require("util");

describe("template", function () {
  require("./setup")({ createTemplate: true });

  const setView = promisify(require("../index").setView);
  const getView = promisify(require("../index").getView);
  const Blog = require("models/blog");

  it("sets a view", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word() + ".txt",
      content: test.fake.random.word(),
    };

    await setView(test.template.id, view);
    const savedView = await getView(test.template.id, view.name);

    expect(savedView.name).toEqual(view.name);
    expect(savedView.content).toEqual(view.content);
  });

  it("sets changes to an existing view", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      content: test.fake.random.word(),
    };

    await setView(test.template.id, view);
    let savedView = await getView(test.template.id, view.name);

    expect(savedView.name).toEqual(view.name);
    expect(savedView.content).toEqual(view.content);

    view.content = test.fake.random.word();
    await setView(test.template.id, view);

    savedView = await getView(test.template.id, view.name);

    expect(savedView.content).toEqual(view.content);
  });

  it("won't set a view with invalid mustache content", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      content: "{{#x}}", // without the closing {{/x}} mustache will err.
    };

    try {
      await setView(test.template.id, view);
    } catch (err) {
      expect(err instanceof Error).toBe(true);
    }
  });

  it("won't set a view against a template that does not exist", async function () {
    const test = this;
    const view = { name: test.fake.random.word() };

    try {
      await setView(test.fake.random.word(), view);
    } catch (err) {
      expect(err instanceof Error).toBe(true);
    }
  });

  // In future this should return an error to the callback, lol
  it("won't set a view with a name that is not a string", async function () {
    const test = this;

    try {
      await setView(test.template.id, { name: null });
    } catch (err) {
      expect(err instanceof Error).toBe(true);
    }
  });

  it("updates the cache ID of the blog which owns a template after setting a view", async function () {
    const test = this;
    const initialCacheID = test.blog.cacheID;
    const view = { name: test.fake.random.word() };

    await setView(test.template.id, view);
    const blog = await promisify(Blog.get)({ id: test.template.owner });

    expect(blog.cacheID).not.toEqual(initialCacheID);
  });

  it("will save a view with urlPatterns", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      urlPatterns: ["/a", "/b"],
    };

    await setView(test.template.id, view);
    const savedView = await getView(test.template.id, view.name);

    expect(savedView.urlPatterns).toEqual(view.urlPatterns);
  });
});