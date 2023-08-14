describe("questions.get", function () {
  require("./setup")();

  it("gets a question", async function () {
    const create = require("../create");
    const get = require("../get");

    const id = await create({ title: "How?", body: "Yes" });
    const question = await get(id);

    expect(question.id).toEqual(id);
    expect(question.title).toEqual("How?");
    expect(question.body).toEqual("Yes");
  });
});
