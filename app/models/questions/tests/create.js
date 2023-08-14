describe("questions.create", function () {
  require("./setup")();
  const create = require("../create");

  it("creates a question", async function () {

    expect(await create({ title: "How?", body: "Yes" })).toEqual(
      jasmine.any(String)
    );
    });

    it("creates a question with tags", async function () {
        expect(
            await create({ title: "How?", body: "Yes", tags: ["tag1", "tag2"] })
        ).toEqual(jasmine.any(String));
    });
});
