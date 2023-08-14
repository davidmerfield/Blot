describe("questions.create", function () {
  require("./setup")();

  it("creates a question", async function () {
    const create = require("../create");

    expect(await create({ title: "How?", body: "Yes" })).toEqual(
      jasmine.any(Number)
    );
  });
});
