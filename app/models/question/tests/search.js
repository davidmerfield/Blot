describe("questions.search", function () {
  require("./setup")();

  const create = require("../create");
  const search = require("../search");

  it("returns results", async function () {
    const first = await create({ title: "How?", body: "Yes" });
    const second = await create({ title: "How?", body: "Yes" });
    const third = await create({ title: "How?", body: "Yes" });

    const results = await search({ query: "how" });

    expect(results.length).toBe(3);
  });
});
