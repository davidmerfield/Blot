describe("questions.get", function () {
  require("./setup")();

  const create = require("../create");
  const get = require("../get");

  it("gets a question", async function () {

    const id = await create({ title: "How?", body: "Yes" });
    const question = await get(id);

    expect(question.id).toEqual(id);
    expect(question.title).toEqual("How?");
    expect(question.body).toEqual("Yes");
  });

  it("gets a question with replies", async function () {

    const id = await create({ title: "How?", body: "Yes" });
    const reply_id = await create({ body: "Answer", parent_id: id });

    const question = await get(id);

    expect(question.replies[0].id).toEqual(reply_id);
  });
});
