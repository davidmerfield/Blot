const { promisify } = require("util");

describe("template", function () {
  require("./setup")({ createTemplate: true });

  const setView = promisify(require("../index").setView);

  const getViewByURL = (templateID, url) => {
    return new Promise((resolve, reject) => {
      require("../index").getViewByURL(
        templateID,
        url,
        (err, viewName, params, query) => {
          if (err) {
            reject(err);
          } else {
            resolve({ viewName, params, query });
          }
        }
      );
    });
  };

  it("gets a view from a URL", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      url: ["/page/:page", "/"],
    };

    await setView(test.template.id, view);
    const res1 = await getViewByURL(test.template.id, "/page/1");

    expect(res1.viewName).toEqual(view.name);
    expect(res1.params).toEqual({ page: "1" });

    const res2 = await getViewByURL(test.template.id, "/");

    expect(res2.viewName).toEqual(view.name);
    expect(res2.params).toEqual({});

    const res3 = await getViewByURL(test.template.id, "/page/2");

    expect(res3.viewName).toEqual(view.name);
    expect(res3.params).toEqual({ page: "2" });
  });

  it("gets a view from a URL with a query string", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      url: ["/apple"],
    };

    await setView(test.template.id, view);
    const { viewName, params, query } = await getViewByURL(
      test.template.id,
      "/apple?foo=bar"
    );

    expect(viewName).toEqual(view.name);
    expect(params).toEqual({});
    expect(query).toEqual({ foo: "bar" });
  });

  it("gets a view from a URL with a trailing slash", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      url: ["/apple"],
    };

    await setView(test.template.id, view);
    const { viewName } = await getViewByURL(test.template.id, "/apple/");

    expect(viewName).toEqual(view.name);
  });

  it("gets a view whose route contains a trailing slash from a URL without", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      url: ["/apple/"],
    };

    await setView(test.template.id, view);
    const { viewName } = await getViewByURL(test.template.id, "/apple");

    expect(viewName).toEqual(view.name);
  });

  it("gets a view by multiple url", async function () {
    const test = this;
    const view = {
      name: test.fake.random.word(),
      url: ["/page/:page", "/"],
    };

    await setView(test.template.id, view);

    const { viewName: rootViewName } = await getViewByURL(
      test.template.id,
      "/"
    );
    expect(rootViewName).toEqual(view.name);

    const { viewName: pageViewName } = await getViewByURL(
      test.template.id,
      "/page/2"
    );
    expect(pageViewName).toEqual(view.name);
  });

  it("gets a view by a lowercase URL without slash", async function () {
    const test = this;
    const url = "/Apple";
    const view = {
      name: test.fake.random.word(),
      url: [url],
    };

    await setView(test.template.id, view);
    const { viewName } = await getViewByURL(test.template.id, "apple");

    expect(viewName).toEqual(view.name);
  });

  it("gets a view by an uppercase URL", async function () {
    const test = this;
    const url = "/apple";
    const view = {
      name: test.fake.random.word(),
      url: [url],
    };

    await setView(test.template.id, view);
    const { viewName } = await getViewByURL(test.template.id, "/Apple");

    expect(viewName).toEqual(view.name);
  });

  it("returns an error for a non-existent URL", async function () {
    const test = this;

    try {
      await getViewByURL(test.template.id, "");
    } catch (err) {
      expect(err instanceof Error).toBe(true);
    }
  });
});
