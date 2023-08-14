describe("questions.update", function () {
  require("./setup")();
  const create = require("../create");
  const update = require("../update");
  const get = require("../get");

  it("updates a question", async function () {
    const id = await create({ title: "How?", body: "Yes" });
    const question = await update(id, { title: "How?", body: "No" });

    expect(question.body).toBe("No");
  });
});
